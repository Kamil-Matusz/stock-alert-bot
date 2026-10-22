-- Frontend uses the publishable key, so access goes through RLS.
-- The bot uses the secret key, which bypasses RLS.
alter table public.stock_alerts enable row level security;

-- Any authenticated user can manage alerts: disable public sign-ups in Supabase Auth.
create policy "Authenticated users manage alerts"
  on public.stock_alerts
  for all
  to authenticated
  using (true)
  with check (true);

alter table public.stock_alerts
  add constraint stock_alerts_targets_check
  check (low_target is null or high_target is null or low_target < high_target);

create or replace function public.reset_stock_alert_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ticker is distinct from old.ticker then
    new.last_price := null;
    new.status := null;
  elsif new.low_target is distinct from old.low_target
     or new.high_target is distinct from old.high_target then
    new.status := null;
  end if;
  return new;
end;
$$;

create trigger stock_alerts_reset_status
  before update of ticker, low_target, high_target on public.stock_alerts
  for each row execute function public.reset_stock_alert_status();
