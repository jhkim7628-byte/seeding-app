import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // API 키 없을 때 더미 데이터로 폴백
    return NextResponse.json({ candidates: getMockCandidates() })
  }

  const { product_id, seed } = await req.json()

  const systemPrompt = `당신은 한국 D2C 헬스푸드 브랜드의 페르소나 마케팅 전문가입니다.
주어진 제품의 시드 데이터를 분석해서 전환율이 가장 높을 페르소나 후보 10개를 만듭니다.

전환율 계산 방법:
- 전환율 = 고통 강도 평균 × 제품 소구점 매칭도
- 고통 강도: 매우 강함(100%), 강함(80%), 중간(60%)
- 소구점 매칭도: 매핑된 소구점 개수 / 전체 소구점 개수
- 결과: 60% ~ 95% 범위로 차등 분배

페르소나명 규칙:
- "[구체적 상황] [구체적 고통]을 가진 [연령/직업] [성별]" 형식
- 예: "화장실 5일째 못 가서 출근길마다 답답한 30대 후반 워킹맘"
- 추상적 표현 금지, 즉시 떠오르는 구체적 장면 필수

반드시 JSON으로만 응답:
{
  "candidates": [
    {
      "rank": 1,
      "name": "페르소나명",
      "conversion_score": 92,
      "pain_intensity_label": "매우 강함",
      "selling_point_match": "4/4",
      "reasoning": "왜 이 페르소나의 전환율이 높은지 한 줄 이유",
      "matched_pains_preview": ["변비", "뱃살", "시간 부족"]
    }
    // ... 10개
  ]
}`

  const userPrompt = `제품 시드 데이터:
- 타깃: ${seed.target_description}
- 구매 이유: ${JSON.stringify(seed.purchase_reasons)}
- 고통 매핑: ${JSON.stringify(seed.pain_cause_empathy)}
- 솔루션: ${JSON.stringify(seed.cause_solution_evidence)}
- 핵심 소구점: ${JSON.stringify(seed.key_selling_points)}

위 데이터를 바탕으로 전환율 높은 순으로 페르소나 후보 10개를 JSON으로 만들어주세요.
전환율은 95%~62% 사이로 자연스럽게 분포시키세요.`

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
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ candidates: getMockCandidates() })
    }
    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch (e) {
    console.error('AI error:', e)
    return NextResponse.json({ candidates: getMockCandidates() })
  }
}

function getMockCandidates() {
  return [
    {
      rank: 1,
      name: '화장실 5일째 못 가서 출근길마다 답답한 30대 후반 워킹맘',
      conversion_score: 92,
      pain_intensity_label: '매우 강함',
      selling_point_match: '4/4',
      reasoning: '변비 + 가족 식단 + 시간 부족 + 뱃살 4개 고통이 모두 제품 소구점과 정확히 매칭',
      matched_pains_preview: ['변비', '시간 부족', '가족 식단 죄책감'],
    },
    {
      rank: 2,
      name: '청바지 단추 안 잠겨서 외출 포기하고 싶은 40대 초반 엄마',
      conversion_score: 88,
      pain_intensity_label: '매우 강함',
      selling_point_match: '4/4',
      reasoning: '뱃살 + 자존감 하락 + 식단 실패 반복으로 즉시 구매 욕구 발생',
      matched_pains_preview: ['뱃살', '자존감', '다이어트 실패'],
    },
    {
      rank: 3,
      name: '남편 회식·야식 따라 먹다가 몸 무거워진 30대 중반 직장맘',
      conversion_score: 85,
      pain_intensity_label: '강함',
      selling_point_match: '3/4',
      reasoning: '외식 잦음 + 뱃살 + 변비 동시 발생으로 솔루션 절실',
      matched_pains_preview: ['외식', '뱃살', '변비'],
    },
    {
      rank: 4,
      name: '가족 야채 챙기느라 정작 본인은 못 챙기는 40대 초중반 주부',
      conversion_score: 82,
      pain_intensity_label: '강함',
      selling_point_match: '3/4',
      reasoning: '가족 우선 + 본인 야채 부족 + 죄책감 = 야채 1.2kg 소구점 직격',
      matched_pains_preview: ['가족 우선', '야채 부족', '죄책감'],
    },
    {
      rank: 5,
      name: '갱년기 시작되며 대사 떨어진 40대 후반 엄마',
      conversion_score: 78,
      pain_intensity_label: '강함',
      selling_point_match: '3/4',
      reasoning: '갱년기 + 뱃살 집중 + 소화불량으로 식이섬유 솔루션 필요',
      matched_pains_preview: ['갱년기', '뱃살', '소화불량'],
    },
    {
      rank: 6,
      name: '사람 만나기 부담스러운 가스 차는 30대 직장 여성',
      conversion_score: 75,
      pain_intensity_label: '강함',
      selling_point_match: '2/4',
      reasoning: '방귀·복부팽만 + 사회생활 영향으로 즉시 해결 욕구',
      matched_pains_preview: ['방귀', '복부팽만', '사회생활'],
    },
    {
      rank: 7,
      name: '아이 입맛 맞추다가 본인 식단 망가진 초등맘',
      conversion_score: 72,
      pain_intensity_label: '중간',
      selling_point_match: '2/4',
      reasoning: '아이 위주 + 본인 영양 불균형, 가족 챙김 키워드 매칭',
      matched_pains_preview: ['아이 식단', '영양 불균형'],
    },
    {
      rank: 8,
      name: '장 안 좋아져서 피부까지 뒤집어진 30대 중반 여성',
      conversion_score: 68,
      pain_intensity_label: '중간',
      selling_point_match: '2/4',
      reasoning: '장 트러블 → 피부 연쇄, 식이섬유로 근본 해결 가능',
      matched_pains_preview: ['장 트러블', '피부 트러블'],
    },
    {
      rank: 9,
      name: '시어머니 모시면서 가족 전체 식단 챙기는 며느리',
      conversion_score: 65,
      pain_intensity_label: '중간',
      selling_point_match: '2/4',
      reasoning: '가족 우선 + 본인 건강 방치, 부담 덜한 솔루션 매력',
      matched_pains_preview: ['가족 우선', '건강 방치'],
    },
    {
      rank: 10,
      name: '건강검진 후 콜레스테롤 경고 받은 40대 직장 여성',
      conversion_score: 62,
      pain_intensity_label: '중간',
      selling_point_match: '1/4',
      reasoning: '건강검진 충격 + 식단 변화 절실, 식이섬유 효과 입증 매칭',
      matched_pains_preview: ['건강검진', '콜레스테롤'],
    },
  ]
}
