import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const { product_id, seed, candidate } = await req.json()

  if (!apiKey) {
    return NextResponse.json({ pains: getMockPains(candidate?.name || '') })
  }

  const systemPrompt = `당신은 페르소나 마케팅 전문가입니다.
선택된 페르소나에 가장 잘 맞는 핵심 고통 후보 5개를 만듭니다.

규칙:
- 첫 페르소나의 이름과 키워드에서 직접 도출된 고통이어야 함
- 강도는 매우 강함(very_strong) / 강함(strong) / 중간(medium) 으로 분류
- 매우 강함 1~2개, 강함 1~2개, 중간 1~2개로 분포
- 구체적인 일상 장면이 떠오르는 표현 사용

반드시 JSON으로만 응답:
{
  "pains": [
    {
      "id": "pain_1",
      "title": "화장실을 며칠씩 못 가는 변비",
      "intensity": "very_strong",
      "intensity_label": "매우 강함",
      "reasoning": "왜 이 고통이 페르소나에게 강한지 한 줄"
    }
    // ... 5개
  ]
}`

  const userPrompt = `페르소나: "${candidate.name}"
고통 미리보기: ${JSON.stringify(candidate.matched_pains_preview)}
제품 시드: ${JSON.stringify(seed.pain_cause_empathy)}
구매 이유: ${JSON.stringify(seed.purchase_reasons)}

위 페르소나에 맞는 핵심 고통 후보 5개를 강도별로 분포시켜 JSON으로 만들어주세요.`

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ pains: getMockPains(candidate.name) })
    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    return NextResponse.json({ pains: getMockPains(candidate.name) })
  }
}

function getMockPains(personaName: string) {
  return [
    {
      id: 'pain_1',
      title: '화장실을 며칠씩 못 가는 변비',
      intensity: 'very_strong',
      intensity_label: '매우 강함',
      reasoning: '만성 변비 해결 욕구 + 식이섬유 부족',
    },
    {
      id: 'pain_2',
      title: '청바지 단추 잠그기 어려운 뱃살',
      intensity: 'strong',
      intensity_label: '강함',
      reasoning: '뱃살 빼고 싶은 욕구 + 운동 시간 부족',
    },
    {
      id: 'pain_3',
      title: '가족 식단 따라가다 본인은 야채 부족',
      intensity: 'strong',
      intensity_label: '강함',
      reasoning: '육식 위주 식습관 + 채소 챙기기 어려움',
    },
    {
      id: 'pain_4',
      title: '방귀·소화불량으로 사람 만나기 부담',
      intensity: 'medium',
      intensity_label: '중간',
      reasoning: '장 트러블 → 사회생활 영향',
    },
    {
      id: 'pain_5',
      title: '매일 다이어트 다짐만 하다 실패',
      intensity: 'medium',
      intensity_label: '중간',
      reasoning: '살 빼고 싶은 욕구 + 시간 부족 → 좌절감',
    },
  ]
}
