create table if not exists public.project_stats (
  project_key text primary key,
  views bigint not null default 0,
  likes bigint not null default 0
);

create table if not exists public.project_visitors (
  project_key text not null,
  visitor_id uuid not null,
  viewed boolean not null default false,
  liked boolean not null default false,
  primary key (project_key, visitor_id)
);

alter table public.project_stats enable row level security;
alter table public.project_visitors enable row level security;

create or replace function public.get_project_stats(p_project_key text, p_visitor_id uuid)
returns table (views bigint, likes bigint, liked boolean)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(s.views, 0),
    coalesce(s.likes, 0),
    coalesce(v.liked, false)
  from (select 1) as one
  left join public.project_stats s on s.project_key = p_project_key
  left join public.project_visitors v on v.project_key = p_project_key and v.visitor_id = p_visitor_id;
$$;

create or replace function public.record_project_view(p_project_key text, p_visitor_id uuid)
returns table (views bigint, likes bigint, liked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  view_was_recorded boolean := false;
begin
  insert into public.project_stats (project_key) values (p_project_key)
  on conflict (project_key) do nothing;

  update public.project_visitors
  set viewed = true
  where project_key = p_project_key and visitor_id = p_visitor_id and not viewed;
  view_was_recorded := found;

  if not exists (select 1 from public.project_visitors where project_key = p_project_key and visitor_id = p_visitor_id) then
    insert into public.project_visitors (project_key, visitor_id, viewed) values (p_project_key, p_visitor_id, true);
    view_was_recorded := true;
  end if;

  if view_was_recorded then
    update public.project_stats set views = views + 1 where project_key = p_project_key;
  end if;

  return query select * from public.get_project_stats(p_project_key, p_visitor_id);
end;
$$;

create or replace function public.toggle_project_like(p_project_key text, p_visitor_id uuid)
returns table (views bigint, likes bigint, liked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  next_liked boolean;
begin
  insert into public.project_stats (project_key) values (p_project_key)
  on conflict (project_key) do nothing;

  insert into public.project_visitors (project_key, visitor_id)
  values (p_project_key, p_visitor_id)
  on conflict (project_key, visitor_id) do nothing;

  select not pv.liked into next_liked from public.project_visitors pv
  where pv.project_key = p_project_key and pv.visitor_id = p_visitor_id;

  update public.project_visitors pv
  set liked = next_liked
  where pv.project_key = p_project_key and pv.visitor_id = p_visitor_id;

  update public.project_stats as ps
  set likes = greatest(0, ps.likes + case when next_liked then 1 else -1 end)
  where ps.project_key = p_project_key;

  return query select * from public.get_project_stats(p_project_key, p_visitor_id);
end;
$$;

grant execute on function public.get_project_stats(text, uuid) to anon;
grant execute on function public.record_project_view(text, uuid) to anon;
grant execute on function public.toggle_project_like(text, uuid) to anon;
