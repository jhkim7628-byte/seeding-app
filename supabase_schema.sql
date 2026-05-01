-- ============================================
-- 현신바이오 시딩 캠페인 관리 - Supabase 스키마
-- Supabase > SQL Editor 에 붙여넣고 실행하세요
-- ============================================

-- 1. 페르소나 테이블
create table if not exists personas (
  id uuid default gen_random_uuid() primary key,
  persona text not null default '',
  who text default '',
  goal text default '',
  pain text default '',
  pain_scene text default '',
  d1 text default '',
  d2 text default '',
  d3 text default '',
  ctr text default '공감형',
  vtype text default '육아맘 공감형',
  s1 text default '',
  s2 text default '',
  s3 text default '',
  tags text[] default '{}',
  title text default '',
  script text default '',
  guide text default '',
  inf text[] default '{"","",""}',
  confirmed text default '',
  score integer default 0,
  grade text default '',
  status text default '기획',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 인플루언서 테이블
create table if not exists influencers (
  id uuid default gen_random_uuid() primary key,
  name text not null default '',
  handle text default '',
  platform text default '인스타그램',
  followers text default '',
  engage text default '',
  tone text default '',
  persona text default '',
  fit integer default 0,
  risk text default '없음',
  campaigns integer default 0,
  color text default '#1D9E75',
  created_at timestamptz default now()
);

-- 3. 제품 세팅 테이블
create table if not exists product_settings (
  id uuid default gen_random_uuid() primary key,
  name text default '식이섬유샷',
  sogu jsonb default '[]',
  tags text[] default '{}',
  warns text[] default '{}',
  ref text default '',
  mention text default '',
  styles text[] default '{}',
  reqs text[] default '{}',
  updated_at timestamptz default now()
);

-- 4. 성과 테이블
create table if not exists performance (
  id uuid default gen_random_uuid() primary key,
  persona_id uuid references personas(id) on delete cascade,
  ctr_rate numeric default 0,
  cvr_rate numeric default 0,
  view_3s numeric default 0,
  view_25 numeric default 0,
  recorded_at timestamptz default now()
);

-- ============================================
-- RLS (Row Level Security) - 공개 읽기/쓰기
-- 로그인 없이 팀원 모두 접근 가능하게 설정
-- ============================================

alter table personas enable row level security;
alter table influencers enable row level security;
alter table product_settings enable row level security;
alter table performance enable row level security;

-- 모든 사용자 읽기 허용
create policy "allow_all_read_personas" on personas for select using (true);
create policy "allow_all_read_influencers" on influencers for select using (true);
create policy "allow_all_read_settings" on product_settings for select using (true);
create policy "allow_all_read_performance" on performance for select using (true);

-- 모든 사용자 쓰기 허용
create policy "allow_all_insert_personas" on personas for insert with check (true);
create policy "allow_all_insert_influencers" on influencers for insert with check (true);
create policy "allow_all_insert_settings" on product_settings for insert with check (true);
create policy "allow_all_insert_performance" on performance for insert with check (true);

-- 모든 사용자 수정 허용
create policy "allow_all_update_personas" on personas for update using (true);
create policy "allow_all_update_influencers" on influencers for update using (true);
create policy "allow_all_update_settings" on product_settings for update using (true);

-- 모든 사용자 삭제 허용
create policy "allow_all_delete_personas" on personas for delete using (true);
create policy "allow_all_delete_influencers" on influencers for delete using (true);

-- ============================================
-- 완료! 이제 Vercel 환경변수를 설정하세요
-- ============================================

-- ============================================
-- 팀원 관리 테이블 (로그인 기능용 추가)
-- ============================================

create table if not exists team_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz default now()
);

alter table team_members enable row level security;
create policy "allow_all_read_team" on team_members for select using (true);
create policy "allow_all_insert_team" on team_members for insert with check (true);
create policy "allow_all_update_team" on team_members for update using (true);
create policy "allow_all_delete_team" on team_members for delete using (true);

-- ============================================
-- 첫 번째 관리자 계정 등록용 함수
-- 처음 가입할 때 자동으로 admin 권한 부여
-- ============================================

create or replace function handle_new_user()
returns trigger as $$
begin
  -- team_members에 없는 신규 유저는 자동 등록 (editor로)
  insert into public.team_members (user_id, email, role)
  values (new.id, new.email, 'editor')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 유저 가입 시 자동 실행
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
