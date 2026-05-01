import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const { product_id, seed, candidate, pains } = await req.json()

  if (!apiKey) {
    return NextResponse.json({ persona: getMockPersona(candidate, pains) })
  }

  const systemPrompt = `당신은 한국 D2C 헬스푸드 브랜드의 페르소나 마케팅 전문가입니다.
페르소나명, 매핑된 고통, 제품 시드를 바탕으로 완성된 페르소나를 만듭니다.

작성 규칙:
- 모든 항목 구체적 일상 장면 기반
- 추상적 표현 금지
- 광고 티 안 나는 자연스러운 어투
- "누구"는 4~6줄로 풍부하게
- "고통 장면"은 영상에 그대로 쓸 수 있는 시각적 묘사
- 구매 결정 D1, D2, D3은 각각 30~50자
- 영상 기획 S1, S2, S3은 각각 50~80자

반드시 JSON으로만 응답:
{
  "persona": {
    "name": "페르소나명",
    "who": "누구 (4~6줄)",
    "pain": "핵심 고통 (1~2줄)",
    "pain_scene": "고통 장면 (시각적 묘사 4~6줄)",
    "decisions": {
      "d1": "D1 나 얘기네",
      "d2": "D2 진짜 되나",
      "d3": "D3 나도 가능"
    },
    "scenarios": {
      "s1": "S1 영상 보는 사람의 현재",
      "s2": "S2 보고 나서",
      "s3": "S3 핵심 장면"
    },
    "ctr_type": "공감형",
    "ctr_match_score": 95,
    "tags": ["변비", "식이섬유", "워킹맘", "장건강", "뱃살", "야채부족", "육식가족", "건강식단", "간편건강", "출근루틴"]
  }
}`

  const userPrompt = `페르소나명: "${candidate.name}"
선택된 고통: ${JSON.stringify(pains.map((p: any) => p.title))}
제품 시드: ${JSON.stringify(seed)}

위 정보로 완성된 페르소나를 JSON으로 만들어주세요.`

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
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ persona: getMockPersona(candidate, pains) })
    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    return NextResponse.json({ persona: getMockPersona(candidate, pains) })
  }
}

function getMockPersona(candidate: any, pains: any[]) {
  return {
    name: candidate?.name || '워킹맘',
    who: '40대 초중반 여성, 결혼 12~15년차 자녀 1~2명. 남편 고기·튀김 식습관 따라가다 야채 부족. 회사+집안일로 운동 시간 없음. 다이어트 시도했지만 매번 실패. 화장실 가는 게 점점 불편해지고 있음.',
    pain: '며칠째 화장실 못 가는 답답함 + 청바지 단추 잠그기 어려운 뱃살. 가족 챙기느라 본인 몸은 매일 무거워지고 있음.',
    pain_scene:
      '아침 7시 식탁 위 어제 시킨 치킨 박스. 거울 앞에서 청바지 단추 잠그려다 한숨. 화장실 다녀온 지 4일째. 출근길 버스에서 옆 사람보다 배가 더 나와 보여서 코트로 가린다.',
    decisions: {
      d1: '가족 식단이 다 고기 위주라 채소 못 챙기는데 두 알이면 끝?',
      d2: '국내산 8종 야채 정제로 두 알? 식이섬유 60% 함량?',
      d3: '가방에 두 알 넣고 다니면 됨. 까먹어도 괜찮음.',
    },
    scenarios: {
      s1: '출근길 버스에서 점심 샐러드 다짐하지만 어제도 김치찜 먹은 본인',
      s2: '가방에 두 알 넣어두고 물과 함께 삼키는 그림이 그려진다',
      s3: '부엌에서 두 알 삼키는 컷 → 야채 1.2kg 대비 → 며칠 후 표정 변화',
    },
    ctr_type: '공감형',
    ctr_match_score: 95,
    tags: [
      '변비',
      '식이섬유',
      '워킹맘',
      '장건강',
      '뱃살',
      '야채부족',
      '육식가족',
      '건강식단',
      '간편건강',
      '출근루틴',
    ],
  }
}
