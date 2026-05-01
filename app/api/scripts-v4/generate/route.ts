import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const { persona_id, scene_id, product_id, options } = await req.json()

  // 컨텍스트 로드
  const { data: persona } = await supabase.from('personas').select('*').eq('id', persona_id).single()
  let scene = null
  if (scene_id) {
    const r = await supabase.from('scene_situations').select('*').eq('id', scene_id).single()
    scene = r.data
  }
  const { data: product } = await supabase.from('products').select('*').eq('id', product_id).maybeSingle()
  const { data: seed } = await supabase
    .from('product_persona_seeds')
    .select('*')
    .eq('product_id', product_id)
    .maybeSingle()

  if (!apiKey) {
    return NextResponse.json(getMockScript(persona, scene, seed))
  }

  const systemPrompt = `당신은 한국 D2C 헬스푸드 브랜드의 숏폼 광고 대본 전문가입니다.
페르소나, 장면 상황, 제품 정보를 바탕으로 30~60초 숏폼 영상 대본을 만듭니다.

대본 작성 5단계 공감스토리 구조:
1. CTR 훅 (0~3초) - 시선 멈추는 한 마디
2. 공감 스토리 (3~15초) - 페르소나 일상 + 실패 경험
3. 전환 브릿지 (15~20초) - "그러다 알게 된"
4. CVR 원물 (20~35초) - 제품 정보 자연스럽게
5. 시간 후기 (35~45초) - n일 변화
6. 마무리 (45~50초) - 자연스러운 끝맺음

광고 티 안 나는 3원칙:
- 스펙→반응: "60% 함유" 대신 "와 이게 60%래요"
- 결론→장면: "효과 있어요" 대신 "그날 저녁부터 변화가..."
- 권유→혼잣말: "구매하세요" 대신 "한번 알아보세요"

규칙:
- 댓글 CTA 절대 금지
- 대본 본문에 (장면 설명) 빨간색 괄호 포함
- 친구한테 말하듯 자연스러운 어투

각 카드의 cut_type은 다음 중 하나:
"제품 단독 컷" | "패키지 단독 컷" | "제형 표현 컷" | "제품 사용 컷" | "비포&애프터 컷" | "제품 셀피 컷"

반드시 JSON으로만 응답:
{
  "title": "영상 제목",
  "cards": [
    {
      "id": "card_1",
      "order": 1,
      "stage": "CTR 훅",
      "time_label": "0~3초",
      "cut_type": "제품 셀피 컷",
      "is_recommended": true,
      "content": "<span>대본 본문</span> <span style='color:#C8102E;font-size:11px;'>(장면 설명)</span>",
      "scene_description": "장면 설명",
      "images": [],
      "is_excluded": false
    }
    // ... CTR 훅, 공감 스토리, 전환 브릿지, CVR 원물, 시간 후기, 마무리 6개
  ]
}`

  const userPrompt = `페르소나: ${persona?.name}
누구: ${persona?.who}
핵심 고통: ${persona?.pain}
고통 장면: ${persona?.pain_scene}

장면 상황: ${scene ? `${scene.emoji} ${scene.title} - ${scene.description}` : '일반'}

제품: ${product?.name || '식이섬유샷'}
핵심 소구점: ${JSON.stringify(seed?.key_selling_points || [])}

위 정보로 30~60초 숏폼 대본 6개 카드를 JSON으로 만들어주세요.
content 필드는 HTML로 작성. 빨간색 괄호 부분은 <span style='color:#C8102E;font-size:11px;'>(...)</span>로.
대본 부분은 <span>...</span>로 감싸기.`

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
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json(getMockScript(persona, scene, seed))
    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    return NextResponse.json(getMockScript(persona, scene, seed))
  }
}

function getMockScript(persona: any, scene: any, seed: any) {
  return {
    title: '출근길 가방에 두 알, 4일 만에 진짜 됐어요',
    cards: [
      {
        id: 'card_1',
        order: 1,
        stage: 'CTR 훅',
        time_label: '0~3초',
        cut_type: '제품 셀피 컷',
        is_recommended: true,
        content:
          '<span style="color:#04342C;font-weight:500;">"화장실 며칠째 못 가신 분 손..."</span> <span style="color:#C8102E;font-size:11px;">(출근길 버스 차창 보며 작게 혼잣말. 정면 클로즈업)</span>',
        scene_description: '출근길 버스 차창 보며 작게 혼잣말. 정면 클로즈업',
        images: [],
        is_excluded: false,
      },
      {
        id: 'card_2',
        order: 2,
        stage: '공감 스토리',
        time_label: '3~15초',
        cut_type: '제품 사용 컷',
        is_recommended: false,
        content:
          '<span>저도 그랬거든요. 어제도 점심에 샐러드 먹어야지 했는데, 결국 동료들 따라 김치찜 먹고 왔어요.</span> <span style="color:#C8102E;font-size:11px;">(회사 점심 식판 위 김치찜 B-roll 인서트)</span> <span>우리 남편이 또 고기파라서 집에서도 야채는 늘 뒷전이고…</span> <span style="color:#C8102E;font-size:11px;">(식탁 위 치킨 박스 + 가족 식사 장면 빠르게)</span>',
        scene_description: '회사 점심 식판 + 가족 식사 장면',
        images: [],
        is_excluded: false,
      },
      {
        id: 'card_3',
        order: 3,
        stage: '전환 브릿지',
        time_label: '15~20초',
        cut_type: '제품 셀피 컷',
        is_recommended: false,
        content:
          '<span>그러다 알게 된 게 있어서요…</span> <span style="color:#C8102E;font-size:11px;">(제품을 손에 든 셀피컷 + 살짝 미소. 슬로우 줌인)</span>',
        scene_description: '제품 셀피컷, 슬로우 줌인',
        images: [],
        is_excluded: false,
      },
      {
        id: 'card_4',
        order: 4,
        stage: 'CVR 원물',
        time_label: '20~35초',
        cut_type: '제품 단독 컷',
        is_recommended: true,
        content:
          '<span>아스파라거스, 브로콜리, 케일… 국내산 야채 8종이 이 두 알에 다 들어있더라구요.</span> <span style="color:#C8102E;font-size:11px;">(제품 단상자 + 정제 두 알 단독컷)</span> <span>식이섬유가 60%나 된다고 하더니, 진짜로 야채 1.2kg을 대체할 수 있는 양이래요.</span> <span style="color:#C8102E;font-size:11px;">(옆에 야채 1.2kg 비교컷 → 정제 클로즈업)</span>',
        scene_description: '제품 단상자 + 야채 1.2kg 비교',
        images: [],
        is_excluded: false,
      },
      {
        id: 'card_5',
        order: 5,
        stage: '시간 후기',
        time_label: '35~45초',
        cut_type: '비포&애프터 컷',
        is_recommended: false,
        content:
          '<span>출근길 가방에 두 알 넣고 다닌 지 4일째인데…</span> <span style="color:#C8102E;font-size:11px;">(가방에서 정제 꺼내 물과 함께 삼키는 사용컷)</span> <span>그날 저녁부터 진짜 변화가 오더라구요. 와… 이게 이렇게 되는구나 싶었어요.</span> <span style="color:#C8102E;font-size:11px;">(며칠 후 표정 변화. 효과 직접 표현 X, 표정으로만)</span>',
        scene_description: '사용컷 + 표정 변화',
        images: [],
        is_excluded: false,
      },
      {
        id: 'card_6',
        order: 6,
        stage: '마무리',
        time_label: '45~50초',
        cut_type: '패키지 단독 컷',
        is_recommended: false,
        content:
          '<span>저처럼 가족 챙기느라 본인 못 챙기는 분들… 한번 알아보세요.</span> <span style="color:#C8102E;font-size:11px;">(출근길 가방 메고 걸어가는 뒷모습 와이드샷. 자막으로 제품명만 살짝)</span>',
        scene_description: '뒷모습 와이드샷',
        images: [],
        is_excluded: false,
      },
    ],
  }
}
