// 제품 페르소나 시드 데이터
export interface ProductPersonaSeed {
  id: string
  product_id: string
  target_description: string
  purchase_reasons: string[]
  pain_cause_empathy: PainCauseEmpathy[]
  cause_solution_evidence: CauseSolutionEvidence[]
  key_selling_points: string[]
  created_at?: string
  updated_at?: string
}

export interface PainCauseEmpathy {
  pain: string
  cause: string
  empathy: string
}

export interface CauseSolutionEvidence {
  cause: string
  solution: string
  evidence: string
}

// 페르소나 후보
export interface PersonaCandidate {
  rank: number
  name: string
  conversion_score: number
  pain_intensity_label: string  // "매우 강함" | "강함" | "중간"
  selling_point_match: string   // "4/4", "3/4" 등
  reasoning: string
  matched_pains_preview: string[]
}

// 핵심 고통 후보
export interface PainCandidate {
  id: string
  title: string
  intensity: 'very_strong' | 'strong' | 'medium'  
  intensity_label: string  // "매우 강함" | "강함" | "중간"
  reasoning: string
  is_selected?: boolean
}

// 자동 생성된 페르소나
export interface GeneratedPersona {
  name: string
  who: string
  pain: string
  pain_scene: string
  decisions: {
    d1: string
    d2: string
    d3: string
  }
  scenarios: {
    s1: string
    s2: string
    s3: string
  }
  ctr_type: '공감형' | '제품 직접형' | '정보형'
  ctr_match_score: number
  tags: string[]
}

// 장면 상황
export interface SceneSituation {
  id: string
  persona_id?: string
  emoji: string
  title: string
  description: string
  reasoning?: string
  is_selected?: boolean
  is_recommended?: boolean
}

// 컷 종류
export type CutType =
  | '제품 단독 컷'
  | '패키지 단독 컷'
  | '제형 표현 컷'
  | '제품 사용 컷'
  | '비포&애프터 컷'
  | '제품 셀피 컷'

export const CUT_TYPES: { value: CutType; label: string; emoji: string }[] = [
  { value: '제품 단독 컷', label: '제품 단독 컷', emoji: '📦' },
  { value: '패키지 단독 컷', label: '패키지 단독 컷', emoji: '📦' },
  { value: '제형 표현 컷', label: '제형 표현 컷', emoji: '💧' },
  { value: '제품 사용 컷', label: '제품 사용 컷', emoji: '✋' },
  { value: '비포&애프터 컷', label: '비포&애프터 컷', emoji: '🪞' },
  { value: '제품 셀피 컷', label: '제품 셀피 컷', emoji: '🤳' },
]

// 대본 단계 종류
export type ScriptStage =
  | 'CTR 훅'
  | '공감 스토리'
  | '전환 브릿지'
  | 'CVR 원물'
  | '시간 후기'
  | '마무리'

export const STAGE_COLORS: Record<ScriptStage, { bg: string; light: string }> = {
  'CTR 훅': { bg: '#1D9E75', light: '#E1F5EE' },
  '공감 스토리': { bg: '#BA7517', light: '#FAEEDA' },
  '전환 브릿지': { bg: '#185FA5', light: '#E6F1FB' },
  'CVR 원물': { bg: '#639922', light: '#EAF3DE' },
  '시간 후기': { bg: '#D4537E', light: '#FBEAF0' },
  '마무리': { bg: '#534AB7', light: '#EEEDFE' },
}

// 대본 카드 (블록)
export interface ScriptCard {
  id: string
  order: number
  stage: ScriptStage
  time_label: string  // "0~3초"
  cut_type: CutType
  is_recommended?: boolean
  content: string  // 대본 본문 (장면 설명 포함)
  scene_description?: string
  images: ScriptCardImage[]
  is_excluded: boolean  // 체크 해제 시 true
}

export interface ScriptCardImage {
  id: string
  url: string
  caption?: string
}

// 대본 v4
export interface ScriptV4 {
  id: string
  title: string
  product_id: string
  persona_id: string
  scene_situation_id?: string
  ctr_type: string
  duration_seconds: number
  total_cuts: number
  cards: ScriptCard[]
  options: ScriptOptions
  status: 'draft' | 'finalized' | 'sent'
  campaign_id?: string
  created_at?: string
  updated_at?: string
}

export interface ScriptOptions {
  duration_30_60: boolean
  no_comment_cta: boolean
  minimize_ad_feel: boolean
  include_scene_description: boolean
}

// 캠페인 (간단)
export interface CampaignSummary {
  id: string
  name: string
  status: 'preparing' | 'active' | 'completed'
  status_label: string
  type: 'influencer' | 'blog' | 'mixed'
  type_emoji: string
  total_count: number
  pending_count: number
  days_left: number
  influencer_preview: { initial: string; color: string }[]
  is_persona_match?: boolean
}

// 인플루언서 (발송용)
export interface InfluencerSendItem {
  id: string
  username: string
  name: string
  follower_count_label: string  // "8.2만"
  category: string
  avg_roas: number
  avatar_color: string
  initial: string
  is_persona_match?: boolean
  is_selected?: boolean
}
