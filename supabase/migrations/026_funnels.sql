-- Funnels — Canvas-based funnel builder
create table if not exists funnels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  nodes       jsonb not null default '[]'::jsonb,
  edges       jsonb not null default '[]'::jsonb,
  viewport    jsonb default '{"x":0,"y":0,"zoom":1}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_funnels_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger funnels_updated_at
  before update on funnels
  for each row execute function update_funnels_updated_at();

-- RLS
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON funnels FOR ALL USING (true) WITH CHECK (true);
