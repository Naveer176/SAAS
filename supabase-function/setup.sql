-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run

create table if not exists premium_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  is_used boolean default false,
  valid_days int default 30,
  created_at timestamp default now()
);

-- Allow the site (anon/public key) to read and update codes for redemption.
alter table premium_codes enable row level security;

create policy "Public can read codes"
on premium_codes for select
to anon
using (true);

create policy "Public can mark a code used"
on premium_codes for update
to anon
using (true)
with check (true);

-- Example: after Naveer confirms a JazzCash/Easypaisa payment on WhatsApp,
-- he runs a line like this to generate a code for that student:
-- insert into premium_codes (code, valid_days) values ('RWVU-8F3K2Q', 30);
