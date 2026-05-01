import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Vercel 서버리스에서는 puppeteer가 무겁기 때문에
// HTML을 반환하고 브라우저 print를 통해 PDF 저장하는 방식 사용 (가장 안정적)
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data: script } = await supabase
    .from('scripts_v4')
    .select('*')
    .eq('id', params.id)
    .single()
  if (!script) return new NextResponse('Not found', { status: 404 })

  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('id', script.persona_id)
    .single()
  let scene = null
  if (script.scene_situation_id) {
    const r = await supabase.from('scene_situations').select('*').eq('id', script.scene_situation_id).single()
    scene = r.data
  }
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', script.product_id)
    .maybeSingle()

  const cards = (script.cards || []).filter((c: any) => !c.is_excluded)

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(script.title)}</title>
<style>
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.6; padding: 0; max-width: 800px; margin: 0 auto; }
.header { border-bottom: 3px solid #1D9E75; padding-bottom: 12px; margin-bottom: 20px; }
.brand { font-size: 9pt; color: #888; letter-spacing: 1px; margin-bottom: 4px; }
.title { font-size: 18pt; font-weight: 700; color: #04342C; margin-bottom: 8px; }
.meta { font-size: 9pt; color: #666; }
.meta strong { color: #04342C; }
.section { margin-bottom: 20px; }
.section-title { font-size: 11pt; font-weight: 600; color: #1D9E75; border-left: 4px solid #1D9E75; padding-left: 8px; margin-bottom: 10px; }
.persona-box { background: #F1EFE8; border-radius: 6px; padding: 12px 14px; font-size: 10pt; line-height: 1.7; }
.persona-box .row { margin-bottom: 4px; }
.persona-box .row:last-child { margin-bottom: 0; }
.persona-box .label { color: #888; display: inline-block; min-width: 80px; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; page-break-inside: avoid; }
.card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.stage-badge { color: white; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: 600; }
.cut-badge { background: #f0f0f0; color: #444; padding: 2px 8px; border-radius: 4px; font-size: 9pt; }
.time-label { color: #888; font-size: 9pt; }
.card-content { font-size: 10pt; line-height: 1.8; padding: 8px 0; }
.card-images { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
.card-images img { width: 90px; height: 68px; object-fit: cover; border-radius: 4px; border: 1px solid #eee; }
.scene-tag { color: #C8102E !important; font-size: 9pt !important; font-style: normal; }
.print-button { position: fixed; top: 20px; right: 20px; background: #1D9E75; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 9999; }
.print-button:hover { background: #0F6E56; }
.help { position: fixed; top: 70px; right: 20px; background: white; border: 1px solid #ddd; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #666; max-width: 200px; z-index: 9998; }
@media print {
  .print-button, .help { display: none; }
}
.footer { border-top: 1px solid #eee; padding-top: 12px; margin-top: 20px; font-size: 8pt; color: #888; text-align: center; }
</style>
</head>
<body>

<button class="print-button" onclick="window.print()">📄 PDF로 저장 / 인쇄</button>
<div class="help">버튼 클릭 후 "대상" → "PDF로 저장" 선택</div>

<div class="header">
  <div class="brand">${escapeHtml(product?.name || '식이섬유샷')} · 시딩 캠페인 대본</div>
  <div class="title">${escapeHtml(script.title)}</div>
  <div class="meta">
    대본 #${script.id?.slice(0, 8)} · ${escapeHtml(script.ctr_type || '공감형')} · 
    ${script.duration_seconds || 50}초 · 
    컷 ${cards.length}개 · 
    ${new Date(script.created_at).toLocaleDateString('ko-KR')}
  </div>
</div>

<div class="section">
  <div class="section-title">📋 페르소나 정보</div>
  <div class="persona-box">
    <div class="row"><span class="label">페르소나</span><strong>${escapeHtml(persona?.name || '')}</strong></div>
    ${scene ? `<div class="row"><span class="label">장면</span>${escapeHtml(scene.emoji)} ${escapeHtml(scene.title)} - ${escapeHtml(scene.description || '')}</div>` : ''}
    ${persona?.who ? `<div class="row"><span class="label">누구</span>${escapeHtml(persona.who)}</div>` : ''}
    ${persona?.pain ? `<div class="row"><span class="label">핵심 고통</span>${escapeHtml(persona.pain)}</div>` : ''}
  </div>
</div>

<div class="section">
  <div class="section-title">📝 대본 (${cards.length}개 카드)</div>
  ${cards
    .map((card: any, idx: number) => {
      const stageColor =
        {
          'CTR 훅': '#1D9E75',
          '공감 스토리': '#BA7517',
          '전환 브릿지': '#185FA5',
          'CVR 원물': '#639922',
          '시간 후기': '#D4537E',
          '마무리': '#534AB7',
        }[card.stage] || '#888'
      return `
      <div class="card">
        <div class="card-header">
          <span class="stage-badge" style="background:${stageColor};">순서 ${idx + 1} · ${escapeHtml(card.stage)}</span>
          <span class="cut-badge">${escapeHtml(card.cut_type)}</span>
          <span class="time-label">${escapeHtml(card.time_label)}</span>
        </div>
        <div class="card-content">${card.content || ''}</div>
        ${
          card.images && card.images.length > 0
            ? `<div class="card-images">${card.images
                .map((img: any) => `<img src="${escapeHtml(img.url)}" alt="" />`)
                .join('')}</div>`
            : ''
        }
      </div>`
    })
    .join('')}
</div>

<div class="footer">
  현신바이오 시딩 캠페인 시스템 · ${new Date().toLocaleString('ko-KR')}
</div>

<script>
// 자동으로 print 다이얼로그 띄우기 (선택사항)
// setTimeout(() => window.print(), 500);
</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
