// app/guide/page.tsx
export default function GuidePage() {
  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-7 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-bold text-gray-900">촬영 가이드</h1>
          <span className="chip chip-green">인플루언서 전달용</span>
        </div>
      </div>
      <div className="p-7 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900">✅ 담아야 할 장면</h2>
            {[
              {title:'CTR — 첫 3초',items:['일상 장면으로 시작 (밥상 차리기, 찬밥 먹기 등)','타깃 감정을 첫 장면에서 직접 보여주기','제품 없이 공감 유도 후 자연스럽게 전환']},
              {title:'공감 스토리',items:['야채 손질하다 시계 보는 장면','야채 사다 냉장고에서 썩히는 장면','가족은 챙기고 나는 대충 먹는 장면']},
              {title:'CVR — 제품 노출',items:['식사 중 자연스럽게 두 알 꺼내는 장면','단상자 성분 면 클로즈업 1회 이상','체감 변화는 표정·장면으로 (수치 언급 금지)']},
            ].map(s=>(
              <div key={s.title} className="bg-[#E6F7F1] border border-[#A7E3CE] rounded-xl p-4">
                <h3 className="text-xs font-bold text-[#0F6E56] mb-2">{s.title}</h3>
                {s.items.map(item=><div key={item} className="text-xs text-gray-700 py-0.5 flex gap-1.5 items-start"><span className="text-[#1D9E75] flex-shrink-0">✓</span>{item}</div>)}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900">🚫 절대 금지사항</h2>
            {[
              {title:'과대광고 금지',items:["'살이 빠진다' 등 직접 효능 표현","수치 기반 효과 보장 (○kg 감량)","변비 치료, 장 질환 개선 등 의학적 표현"]},
              {title:'연출 금지',items:['처음부터 제품 들고 설명하는 방식','스튜디오 느낌의 세팅된 촬영','댓글 링크 CTA 형태']},
              {title:'표기 누락 금지',items:['[광고] 또는 #광고 표기 반드시 포함','경쟁 제품 직접 비교']},
            ].map(s=>(
              <div key={s.title} className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="text-xs font-bold text-red-600 mb-2">{s.title}</h3>
                {s.items.map(item=><div key={item} className="text-xs text-gray-700 py-0.5 flex gap-1.5 items-start"><span className="text-red-500 flex-shrink-0">✕</span>{item}</div>)}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3">⏱ 씬 타임라인 (30~60초)</h2>
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {[
              {time:'0:00~0:03',name:'CTR 훅',desc:'첫 3초에 "나 얘기네" 유발',c:'#E53E3E'},
              {time:'0:03~0:15',name:'공감 스토리',desc:'일상 장면 + 실패 경험',c:'#F59E0B'},
              {time:'0:15~0:20',name:'전환 브릿지',desc:'"또 이러는 건가 싶었는데"',c:'#3182CE'},
              {time:'0:20~0:45',name:'CVR',desc:'제품 등장 → 성분 → 체감',c:'#1D9E75'},
              {time:'0:45~0:60',name:'마무리',desc:'자연스럽게. "링크는 캡션에"',c:'#7C3AED'},
            ].map((b,i)=>(
              <div key={i} className="flex-1 p-3 border-r border-gray-200 last:border-0 bg-white">
                <div className="text-[10px] font-bold font-mono mb-1" style={{color:b.c}}>{b.time}</div>
                <div className="text-xs font-semibold text-gray-900 mb-1">{b.name}</div>
                <div className="text-[11px] text-gray-500 leading-snug">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
