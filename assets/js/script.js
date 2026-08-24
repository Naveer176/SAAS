// ===================== CONFIG =====================
const DAILY_FREE_WORD_LIMIT = 1500;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/rewrite`;

// ===================== ELEMENTS =====================
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const inCount = document.getElementById('inCount');
const outCount = document.getElementById('outCount');
const rewriteBtn = document.getElementById('rewriteBtn');
const copyBtn = document.getElementById('copyBtn');
const statusMsg = document.getElementById('statusMsg');
const modeSelect = document.getElementById('mode');
const usageText = document.getElementById('usageText');
const usageFill = document.getElementById('usageFill');
const unlockBtn = document.getElementById('unlockBtn');
const unlockCodeInput = document.getElementById('unlockCode');
const unlockMsg = document.getElementById('unlockMsg');

// ===================== HELPERS =====================
function wordCount(str) {
  const trimmed = str.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function todayKey() {
  const d = new Date();
  return `rwvu_usage_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function isPremiumActive() {
  const expiry = localStorage.getItem('rwvu_premium_until');
  return expiry && new Date(expiry) > new Date();
}

function getUsedWordsToday() {
  return parseInt(localStorage.getItem(todayKey()) || '0', 10);
}

function addUsedWords(n) {
  const used = getUsedWordsToday() + n;
  localStorage.setItem(todayKey(), used.toString());
  refreshUsageUI();
}

function refreshUsageUI() {
  if (isPremiumActive()) {
    usageText.textContent = 'Premium active — unlimited rewrites';
    usageFill.style.width = '100%';
    return;
  }
  const used = Math.min(getUsedWordsToday(), DAILY_FREE_WORD_LIMIT);
  usageText.textContent = `${used} / ${DAILY_FREE_WORD_LIMIT} words used today`;
  usageFill.style.width = `${(used / DAILY_FREE_WORD_LIMIT) * 100}%`;
}

function setStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = `status-msg ${type || ''}`;
}

// ===================== LIVE COUNTS =====================
inputText.addEventListener('input', () => {
  inCount.textContent = `${wordCount(inputText.value)} words`;
});
outputText.addEventListener('input', () => {
  outCount.textContent = `${wordCount(outputText.value)} words`;
});

// ===================== REWRITE =====================
rewriteBtn.addEventListener('click', async () => {
  const text = inputText.value.trim();
  if (!text) {
    setStatus('Paste some text first.', 'error');
    return;
  }

  const words = wordCount(text);

  if (!isPremiumActive() && getUsedWordsToday() + words > DAILY_FREE_WORD_LIMIT) {
    setStatus('Daily free limit reached. Go Premium for unlimited rewrites.', 'error');
    return;
  }

  rewriteBtn.disabled = true;
  rewriteBtn.textContent = 'Rewriting...';
  setStatus('', '');

  try {
    const res = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ text, mode: modeSelect.value })
    });

    if (!res.ok) throw new Error(`Server error (${res.status})`);
    const data = await res.json();

    if (!data.result) throw new Error('No result returned.');

    outputText.value = data.result;
    outCount.textContent = `${wordCount(data.result)} words`;

    if (!isPremiumActive()) addUsedWords(words);

    setStatus('Done — review the result before submitting.', 'ok');
  } catch (err) {
    console.error(err);
    setStatus('Something went wrong. Please try again in a moment.', 'error');
  } finally {
    rewriteBtn.disabled = false;
    rewriteBtn.textContent = 'Rewrite Text';
  }
});

// ===================== COPY =====================
copyBtn.addEventListener('click', async () => {
  if (!outputText.value.trim()) {
    setStatus('Nothing to copy yet.', 'error');
    return;
  }
  await navigator.clipboard.writeText(outputText.value);
  setStatus('Copied to clipboard.', 'ok');
});

// ===================== PREMIUM UNLOCK =====================
unlockBtn.addEventListener('click', async () => {
  const code = unlockCodeInput.value.trim();
  if (!code) {
    unlockMsg.textContent = 'Enter a code first.';
    unlockMsg.className = 'status-msg error';
    return;
  }

  unlockBtn.disabled = true;
  unlockBtn.textContent = 'Checking...';

  try {
    // Looks up the code in the `premium_codes` table.
    // Expected columns: code (text), is_used (bool), valid_days (int)
    const { data, error } = await supabaseClient
      .from('premium_codes')
      .select('*')
      .eq('code', code)
      .eq('is_used', false)
      .single();

    if (error || !data) {
      unlockMsg.textContent = 'Invalid or already-used code.';
      unlockMsg.className = 'status-msg error';
      return;
    }

    const days = data.valid_days || 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    localStorage.setItem('rwvu_premium_until', expiry.toISOString());

    await supabaseClient
      .from('premium_codes')
      .update({ is_used: true })
      .eq('code', code);

    unlockMsg.textContent = `Premium activated until ${expiry.toDateString()}.`;
    unlockMsg.className = 'status-msg ok';
    refreshUsageUI();
  } catch (err) {
    console.error(err);
    unlockMsg.textContent = 'Could not verify code right now.';
    unlockMsg.className = 'status-msg error';
  } finally {
    unlockBtn.disabled = false;
    unlockBtn.textContent = 'Activate';
  }
});

// ===================== INIT =====================
refreshUsageUI();
