// Supabase Edge Function: "rewrite"
// Paste this whole file into: Supabase Dashboard -> Edge Functions -> Create a new function -> name it "rewrite"
// Then set a secret named GROQ_API_KEY (Dashboard -> Edge Functions -> rewrite -> Secrets)
// Get a free Groq API key at https://console.groq.com (no cost, generous free limits)

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODE_INSTRUCTIONS: Record<string, string> = {
  standard: "Rewrite the text below in clear, natural wording. Keep the same meaning and roughly the same length.",
  academic: "Rewrite the text below in a formal, academic tone suitable for a university assignment. Keep the same meaning.",
  simple: "Rewrite the text below using simple, easy-to-understand wording. Keep the same meaning.",
  fluent: "Rewrite the text below so it reads smoothly and naturally, improving flow and word choice. Keep the same meaning.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, mode } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instruction = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.standard;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a careful writing assistant for university students. You rewrite text in fresh wording while preserving the original meaning. Respond with ONLY the rewritten text, no preamble, no notes.",
          },
          {
            role: "user",
            content: `${instruction}\n\nText:\n${text}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error:", errText);
      return new Response(JSON.stringify({ error: "Rewrite engine failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqRes.json();
    const result = groqData.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
