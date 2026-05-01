-- ============================================
-- v3 추가 스키마 (장면 순서·색상·블로그·UTM)
-- ============================================

-- products에 색상 추가
alter table products add column if not exists brand_color text default '#C8102E';

-- campaigns에 장면 순서 추가
alter table campaigns add column if not exists scenes jsonb default '[]';
-- 형태: [{enabled, order, image_url, title, note, recommended}]

-- campaigns에 페르소나 정보 추가 (선택)
alter table campaigns add column if not exists representative_persona_id uuid references personas(id) on delete set null;

-- personas에 UTM 매칭 정보 추가
alter table personas add column if not exists utm_source text default '';
alter table personas add column if not exists utm_medium text default '';
alter table personas add column if not exists utm_campaign text default '';
alter table personas add column if not exists utm_url text default '';
alter table personas add column if not exists ga_clicks integer default 0;
alter table personas add column if not exists ga_conversions integer default 0;

-- 블로그 템플릿 테이블
create table if not exists blog_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text default '인플루언서 시딩',
  content text not null,
  tags text[] default '{}',
  used_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table blog_templates enable row level security;
create policy "allow_all_blog_templates" on blog_templates for all using (true) with check (true);

-- 기본 시딩 문구 템플릿 입력
insert into blog_templates (name, category, content, tags) values
  ('첫 인사 - 정중', '인플루언서 시딩',
   '안녕하세요! [브랜드명] 마케팅팀입니다.\n\n[크리에이터명]님의 콘텐츠를 잘 보고 있습니다.\n[제품명] 관련 시딩 협업 제안드리고 싶어 연락드립니다.\n\n자세한 내용은 회신주시면 가이드 PDF와 함께 안내드리겠습니다.\n\n감사합니다.',
   array['{시딩}','{협업제안}','{인사']),
  ('샘플 발송 안내', '인플루언서 시딩',
   '[크리에이터명]님 안녕하세요!\n\n시딩 진행해주셔서 감사합니다.\n샘플은 [날짜]에 발송 예정이며, 받으신 후 [전달일]까지 1차 콘텐츠 전달 부탁드립니다.\n\n업로드 일정: [업로드일]\n콘텐츠 유형: [콘텐츠 유형]\n주요 가이드: [PDF 첨부]\n\n궁금하신 점 있으시면 편하게 연락주세요!',
   array['{시딩}','{샘플발송}','{일정}']),
  ('업로드 D-1 리마인드', '인플루언서 시딩',
   '안녕하세요 [크리에이터명]님,\n\n내일 업로드 일정 다시 한번 안내드립니다.\n\n📅 업로드: [업로드일]\n✅ 필수 표기: #광고 또는 #협찬\n✅ 멘션: [필수 멘션]\n\n업로드 완료 후 링크 공유 부탁드립니다!',
   array['{시딩}','{리마인드}','{업로드']),
  ('업로드 완료 감사', '인플루언서 시딩',
   '[크리에이터명]님 업로드 잘 확인했습니다!\n\n좋은 콘텐츠 만들어주셔서 정말 감사합니다 :)\n\n다음 캠페인 때도 좋은 인연으로 다시 뵐 수 있으면 좋겠습니다.\n감사합니다.',
   array['{시딩}','{감사}','{마무리}'])
on conflict do nothing;

-- 영상별 UTM 추적 뷰 (대시보드용)
create or replace view persona_performance_view as
select
  p.id, p.title, p.persona, p.utm_url, p.utm_source, p.utm_medium, p.utm_campaign,
  p.ga_clicks, p.ga_conversions, p.score, p.grade, p.status,
  c.name as campaign_name, c.id as campaign_id
from personas p
left join campaigns c on p.campaign_id = c.id;
