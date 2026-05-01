import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API 키가 설정되지 않았어요. Vercel 환경변수에 ANTHROPIC_API_KEY를 추가해주세요.' }, { status: 500 })

  const body = await req.json()
  const { persona, who, goal, pain, pain_scene, d1, d2, d3, ctr, vtype, s1, s2, s3, campaign_id } = body

  // 캠페인이 연결되어 있으면 제품 정보 자동 로드
  let productContext = ''
  if (campaign_id) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*, product:products(*)')
      .eq('id', campaign_id)
      .single()

    if (campaign?.product) {
      const p = campaign.product
      productContext = `

[연결된 캠페인 제품 정보]
- 제품명: ${p.name}
- 핵심 소구점: ${(p.features || []).map((f:any) => `${f.title} (${f.sub.filter(Boolean).join(', ')})`).join(' / ')}
- 멘션 가이드: ${(p.mention_guide || []).join(' / ')}
- 유의사항: ${(p.cautions || []).join(', ')}
- 해시태그: ${(p.hashtags || []).join(' ')}

위 제품 정보를 자연스럽게 대본에 녹여주세요. 다만 광고 티 안 나게 주의.`
    }
  }

  const systemPrompt = `당신은 시딩 캠페인 숏폼 광고 대본 작가예요.

[5단계 공감스토리 구조]
1. CTR 훅 (첫 3초): 타깃 감정 직격 - "나 얘기네" 유발
2. 공감 스토리 (3~15초): 타깃의 일상 + 실패 경험
3. 전환 브릿지 (15~20초): "그러다 알게 된" "또 이러는 건가 싶었는데"
4. CVR (20~45초): 원물 소개 → 시간 흐름 후기 → 효과 요약
5. 마무리 (45~60초): 자연스럽게. 댓글 CTA 절대 금지

[광고 티 안 나는 3원칙]
① 스펙 말고 반응으로
② 결론 말고 장면으로
③ 권유 말고 혼잣말로

[필수 규칙]
- 친구한테 하소연하듯 캐주얼하게
- 효능 직접 표현 금지
- 수치 보장 금지
- 댓글 CTA 금지
- 매번 다른 톤·다른 시작 방식으로 창의적으로 작성${productContext}`

  const userPrompt = `다음 페르소나에 맞는 30~60초 숏폼 광고 대본을 작성해주세요.

[페르소나] ${persona}
[구체적 인물] ${who || '미입력'}
[기획 목적] ${goal || '미입력'}
[핵심 고통] ${pain || '미입력'}
[고통 장면] ${pain_scene || '미입력'}
[CTR 유형] ${ctr}
[영상 유형] ${vtype}

[구매 결정 3순간]
- 나 얘기네: ${d1 || '미입력'}
- 이게 진짜 되나?: ${d2 || '미입력'}
- 나도 할 수 있겠다: ${d3 || '미입력'}

[기획 3줄 요약]
- 영상을 보는 사람은 지금: ${s1 || '미입력'}
- 영상을 보고 나서: ${s2 || '미입력'}
- 반드시 보여줄 장면: ${s3 || '미입력'}

JSON 형식으로만 응답하세요. 다른 설명 없이:
{
  "title": "영상 제목 (15자 이내)",
  "script": "대본 전체 (줄바꿈은 \\n으로)",
  "guide": "촬영 가이드 포인트 (· 로 구분된 3~5개 장면)"
}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await res.json()
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 })

    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '응답을 파싱할 수 없어요', raw: text }, { status: 500 })

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '생성 실패' }, { status: 500 })
  }
}
