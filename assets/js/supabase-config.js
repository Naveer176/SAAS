// ===== SUPABASE CONFIG =====
// Paste your project's URL and anon (public) key here.
// Find these in: Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = "https://orchvfbbaitwgvthdhrp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yY2h2ZmJiYWl0d2d2dGhkaHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTM1NjcsImV4cCI6MjEwMzE2OTU2N30.f6rFbedgwLqqC2trIVglf4YszG9IVYUgWILbfLesygY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
