-- ============================================
-- 1단계 추가 스키마 (캠페인·상품·브랜드)
-- 이 부분만 SQL Editor에 붙여넣고 실행
-- ============================================

-- 1. 브랜드
create table if not exists brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  intro text default '',
  created_at timestamptz default now()
);

-- 2. 카테고리
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- 3. 상품
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  brand_id uuid references brands(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  url text default '',
  price integer default 0,
  image_url text default '',
  -- 핵심 소구점 3개 (PDF용)
  features jsonb default '[]', -- [{title:'', sub:['','']}]
  -- PDF 가이드용 정보
  hashtags text[] default '{}',
  cautions text[] default '{}',          -- 유의사항
  references_text text[] default '{}',   -- 참고사항
  mention_guide text[] default '{}',     -- 멘션 작성 가이드
  must_requests text[] default '{}',     -- 필수 요청사항
  filming_guide text[] default '{}',     -- 영상 촬영 가이드
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. 캠페인
create table if not exists campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text default 'influencer' check (type in ('influencer', 'blog')),
  brand_id uuid references brands(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  manager_id uuid references team_members(id) on delete set null,
  start_date date,
  end_date date,
  budget bigint default 0,
  status text default '임시' check (status in ('임시', '대기', '활성', '완료', '취소')),
  approval_status text default '대기' check (approval_status in ('대기', '승인', '반려')),
  -- 콘텐츠 정보
  content_type text default '인스타그램 릴스',
  content_topic text default '',
  upload_date date,
  delivery_date date,
  -- 캠페인별 커스텀 (없으면 product에서 상속)
  custom_hashtags text[] default '{}',
  custom_cautions text[] default '{}',
  custom_filming_guide text[] default '{}',
  -- 상세 이미지 (최대 5장)
  detail_images text[] default '{}',
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. 캠페인 ↔ 페르소나 연결
alter table personas add column if not exists campaign_id uuid references campaigns(id) on delete set null;

-- RLS 정책
alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table campaigns enable row level security;

create policy "allow_all_brands" on brands for all using (true) with check (true);
create policy "allow_all_categories" on categories for all using (true) with check (true);
create policy "allow_all_products" on products for all using (true) with check (true);
create policy "allow_all_campaigns" on campaigns for all using (true) with check (true);

-- 기본 카테고리 입력
insert into categories (name) values
  ('뷰티'),('피부'),('건강기능식품'),('식품'),('패션')
on conflict do nothing;

-- 기본 브랜드 입력
insert into brands (name, intro) values
  ('피럴킴', '국내산 천연 야채로 건강을 챙기는 푸르농 브랜드'),
  ('현신바이오', 'D2C 헬스 푸드 전문 브랜드')
on conflict do nothing;
