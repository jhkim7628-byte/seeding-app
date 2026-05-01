export type Status = '기획' | '섭외' | '촬영' | '검수' | '완료'
export type Grade = 'S' | 'A' | 'B' | 'C' | ''
export type CtrType = '공감형' | '정보형' | '제품 직접형'

export interface Persona {
  id?: string
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

export interface Performance {
  id?: string
  persona_id: string
  ctr_rate: number
  cvr_rate: number
  view_3s: number
  view_25: number
  recorded_at?: string
}
