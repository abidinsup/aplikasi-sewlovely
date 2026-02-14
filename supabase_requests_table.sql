-- Create table for partner data change requests
create table public.partner_requests (
  id uuid default gen_random_uuid() primary key,
  partner_id uuid references public.partners(id) not null,
  type text not null check (type in ('bank', 'phone')),
  old_data text,
  new_data text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.partner_requests enable row level security;

create policy "Partners can view their own requests"
  on public.partner_requests for select
  using (auth.uid() = partner_id);

create policy "Partners can create requests"
  on public.partner_requests for insert
  with check (auth.uid() = partner_id);

create policy "Admins can view all requests"
  on public.partner_requests for select
  using (true); -- Adjust if you have admin role check

create policy "Admins can update requests"
  on public.partner_requests for update
  using (true); -- Adjust if you have admin role check
