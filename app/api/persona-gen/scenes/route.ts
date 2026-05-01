import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const { persona_id } = await req.json()

  // 페르소나 정보 조회
  const { data: persona } = await supabase.from('personas').select('*').eq('id', persona_id).single()

  if (!persona) {
    return NextResponse.json({ scenes: getMockScenes(persona_id) })
  }

  if (!apiKey) {
    return NextResponse.json({ scenes: getMockScenes(persona_id, persona) })
  }

  const systemPrompt = `당신은 한국 D2C 헬스푸드 브랜드의 영상 광고 기획 전문가입니다.
페르소나의 고통과 일상을 바탕으로 영상 시작점이 될 장면 상황 5개를 만듭니다.

장면 상황 작성 규칙:
- 페르소나의 일상 속 구체적 한 순간
- 30~60초 영상의 시작에 자연스럽게 들어갈 수 있어야 함
- 1번은 추천 상황 (가장 강력한 공감 포인트)
- 5개의 상황은 서로 다른 시간대/장소
- 각 상황마다 왜 좋은지 이유 설명

반드시 JSON으로만 응답:
{
  "scenes": [
    {
      "id": "scene_1",
      "emoji": "🚌",
      "title": "출근길 버스 안",
      "description": "구체적 묘사 (2~3줄)",
      "reasoning": "왜 이 장면이 효과적인지 (1줄)",
      "is_recommended": true
    }
    // ... 5개
  ]
}`

  const userPrompt = `페르소나: ${persona.name}
누구: ${persona.who || ''}
핵심 고통: ${persona.pain || ''}
고통 장면: ${persona.pain_scene || ''}

위 페르소나에 맞는 영상 시작점 장면 상황 5개를 JSON으로 만들어주세요.`

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
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ scenes: getMockScenes(persona_id, persona) })
    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    return NextResponse.json({ scenes: getMockScenes(persona_id, persona) })
  }
}

function getMockScenes(persona_id: string, persona?: any) {
  return [
    {
      id: 'scene_1_' + Date.now(),
      emoji: '🚌',
      title: '출근길 버스 안',
      description:
        '버스 창가에 앉아 차창에 비친 본인 얼굴. 며칠째 답답한 배를 살짝 만지며 한숨. 옆자리 사람 시선 의식.',
      reasoning: '출퇴근 직장 여성 99%가 공감. 변비 고통이 일상에 자연스럽게 녹아듦.',
      is_recommended: true,
    },
    {
      id: 'scene_2_' + Date.now(),
      emoji: '🍗',
      title: '저녁 식탁',
      description:
        '시킨 치킨 박스 가득. 남편·아이는 신나게 먹는데 본인은 야채 한 줌 골라먹는다. "내일은 진짜 샐러드..." 마음속 다짐.',
      reasoning: '가족 식단 위주 워킹맘 공감 직격. 죄책감 자극.',
      is_recommended: false,
    },
    {
      id: 'scene_3_' + Date.now(),
      emoji: '👖',
      title: '옷장 앞 거울',
      description:
        '출근 준비. 평소 입던 청바지 단추 안 잠긴다. 거울에 비친 본인 옆모습 보고 한숨. "또 다이어트 실패..."',
      reasoning: '비주얼 임팩트 강함. 뱃살 고통 직격.',
      is_recommended: false,
    },
    {
      id: 'scene_4_' + Date.now(),
      emoji: '🏠',
      title: '아침 7시 부엌',
      description:
        '남편 도시락 + 아이 등교 준비로 바쁜 부엌. 본인은 식탁 모서리에서 식은 커피 한 모금. 아침 식사? 사치.',
      reasoning: '워킹맘 일상 공감. 시간 부족 강조.',
      is_recommended: false,
    },
    {
      id: 'scene_5_' + Date.now(),
      emoji: '💼',
      title: '회사 점심시간',
      description:
        '동료들과 점심 식당. "오늘은 샐러드..." 했지만 결국 메뉴판에서 김치찌개 찍음. 죄책감 + 안도감.',
      reasoning: '직장 여성 공감. 다이어트 의지 좌절.',
      is_recommended: false,
    },
  ]
}
