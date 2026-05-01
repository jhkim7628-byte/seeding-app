export type Status = '기획' | '섭외' | '촬영' | '검수' | '완료'
export type Grade = 'S' | 'A' | 'B' | 'C' | ''
export type CtrType = '공감형' | '정보형' | '제품 직접형'
export type CampaignStatus = '임시' | '대기' | '활성' | '완료' | '취소'
export type ApprovalStatus = '대기' | '승인' | '반려'
export type CampaignType = 'influencer' | 'blog'

export interface Persona {
  id?: string
  campaign_id?: string
  persona: string
  who: string
  goal: string
  pain: string
  pain_scene: string
  d1: string
  d2: string
  d3: string
  ctr: CtrType
  vtype: string
  s1: string
  s2: string
  s3: string
  tags: string[]
  title: string
  script: string
  guide: string
  inf: string[]
  confirmed: string
  score: number
  grade: Grade
  status: Status
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_url?: string
  ga_clicks?: number
  ga_conversions?: number
  created_at?: string
  updated_at?: string
}

export interface Influencer {
  id?: string
  name: string
  handle: string
  platform: string
  followers: string
  engage: string
  tone: string
  persona: string
  fit: number
  risk: string
  campaigns: number
  color: string
  created_at?: string
}

export interface ProductSetting {
  id?: string
  name: string
  sogu: { icon: string; main: string; sub: string }[]
  tags: string[]
  warns: string[]
  ref: string
  mention: string
  styles: string[]
  reqs: string[]
  updated_at?: string
}

export interface Brand {
  id?: string
  name: string
  intro: string
  created_at?: string
}

export interface Category {
  id?: string
  name: string
  created_at?: string
}

export interface Feature {
  title: string
  sub: string[]
}

export interface Product {
  id?: string
  name: string
  brand_id?: string
  category_id?: string
  url: string
  price: number
  image_url: string
  brand_color: string
  features: Feature[]
  hashtags: string[]
  cautions: string[]
  references_text: string[]
  mention_guide: string[]
  must_requests: string[]
  filming_guide: string[]
  created_at?: string
  updated_at?: string
  brand?: Brand
  category?: Category
}

export interface Scene {
  enabled: boolean
  order: number
  title: string
  note: string
  image_url: string
  recommended: boolean
}

export interface Campaign {
  id?: string
  name: string
  type: CampaignType
  brand_id?: string
  product_id?: string
  manager_id?: string
  representative_persona_id?: string
  start_date?: string
  end_date?: string
  budget: number
  status: CampaignStatus
  approval_status: ApprovalStatus
  content_type: string
  content_topic: string
  upload_date?: string
  delivery_date?: string
  custom_hashtags: string[]
  custom_cautions: string[]
  custom_filming_guide: string[]
  detail_images: string[]
  description: string
  scenes: Scene[]
  created_at?: string
  updated_at?: string
  brand?: Brand
  product?: Product
  manager?: { name: string; email: string }
}

export interface BlogTemplate {
  id?: string
  name: string
  category: string
  content: string
  tags: string[]
  used_count?: number
  created_at?: string
  updated_at?: string
}

export const DEFAULT_SCENES: Scene[] = [
  { enabled: true, order: 1, title: '제품 단독 컷', note: '', image_url: '', recommended: true },
  { enabled: true, order: 2, title: '패키지 단독 컷', note: '', image_url: '', recommended: false },
  { enabled: true, order: 3, title: '제형 표현 컷', note: '', image_url: '', recommended: true },
  { enabled: true, order: 4, title: '발색 표현 컷 (색조 제품인 경우 권장)', note: '', image_url: '', recommended: false },
  { enabled: true, order: 5, title: '제품 사용 컷', note: '', image_url: '', recommended: true },
  { enabled: true, order: 6, title: '비포&애프터 컷', note: '', image_url: '', recommended: true },
  { enabled: true, order: 7, title: '제품을 들고 찍은 셀피 컷', note: '', image_url: '', recommended: false },
]
