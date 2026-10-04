create table people (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table accounts (id uuid primary key default gen_random_uuid(), person_id uuid not null references people on delete cascade, email text not null,
  rate numeric not null check (rate in (0.10,0.15)), status text not null default 'Active' check (status in ('Active','Inactive')),
  issue text not null default 'No Issue' check (issue in ('No Issue','Account Suspended','Multimango Suspended')), notes text,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table work_records (id uuid primary key default gen_random_uuid(), account_id uuid not null references accounts on delete cascade,
  work_date date not null, amount_usd numeric(12,2) not null check (amount_usd >= 0), note text, created_at timestamptz default now());
-- keep accounts.updated_at fresh when work is added
create function touch_account() returns trigger language plpgsql as $$ begin update accounts set updated_at=now() where id=new.account_id; return new; end $$;
create trigger work_touch after insert on work_records for each row execute function touch_account();
-- totals are always derived, never typed in
create view account_totals as select a.*, coalesce(sum(w.amount_usd),0) as total_work, coalesce(sum(w.amount_usd),0)*a.rate as earnings
  from accounts a left join work_records w on w.account_id=a.id group by a.id;
alter view account_totals set (security_invoker = on);
alter table people enable row level security; alter table accounts enable row level security; alter table work_records enable row level security;
create policy "auth all" on people for all to authenticated using (true) with check (true);
create policy "auth all" on accounts for all to authenticated using (true) with check (true);
create policy "auth all" on work_records for all to authenticated using (true) with check (true);
