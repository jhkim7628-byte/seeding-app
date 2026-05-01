import { Campaign, Persona, Scene } from '@/types'

// 색상에서 hover/light 색상 자동 생성
function adjustColor(hex: string, amount: number): string {
  const c = hex.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(c.substring(0,2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(c.substring(2,4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(c.substring(4,6), 16) + amount))
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('')
}

const formatDate = (d?: string) => {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  const days = ['일','월','화','수','목','금','토']
  return `${dt.getFullYear()}년 ${dt.getMonth()+1}월 ${dt.getDate()}일 (${days[dt.getDay()]})`
}

export function generateCampaignPdf(c: Campaign, personas: Persona[], scenes: Scene[]): string {
  const product = c.product
  const brand = c.brand
  const brandColor = product?.brand_color || '#C8102E'
  const brandColorLight = adjustColor(brandColor, 40)

  const hashtags = (c.custom_hashtags?.length ? c.custom_hashtags : product?.hashtags) || []
  const cautions = product?.cautions || []
  const filming = (c.custom_filming_guide?.length ? c.custom_filming_guide : product?.filming_guide) || []
  const mention = product?.mention_guide || []
  const requests = product?.must_requests || []
  const refs = product?.references_text || []

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${c.name} - 콘텐츠 가이드</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Noto Sans KR', sans-serif; color: #1a1a1a; }

@page { size: A4; margin: 0; }
.page {
  width: 210mm; height: 297mm;
  page-break-after: always; position: relative;
  overflow: hidden; background: white;
}
.page:last-child { page-break-after: avoid; }

/* 1페이지 표지 */
.cover {
  background: ${brandColor};
  padding: 8mm;
  display: flex; flex-direction: column;
}
.cover-frame {
  border: 3px solid white;
  flex: 1;
  padding: 18mm 16mm 16mm;
  display: flex; flex-direction: column;
  position: relative;
}
.cover h1 {
  color: white;
  font-size: 88px; font-weight: 900;
  line-height: 0.95; letter-spacing: -3px;
  z-index: 2;
}
.cover h1 span { display: block; }
.cover .right-text {
  position: absolute; top: 22mm; right: 16mm;
  text-align: right; color: white;
  z-index: 2;
}
.cover .right-text .product-name { font-size: 38px; font-weight: 900; line-height: 1.2; margin-bottom: 6px; }
.cover .right-text .content-type { font-size: 32px; font-weight: 700; line-height: 1.2; }
.cover .product-img {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  margin-top: 20mm;
}
.cover .product-img img {
  max-width: 70%; max-height: 85%;
  object-fit: contain;
}
.cover .product-placeholder {
  width: 280px; height: 350px;
  background: rgba(255,255,255,0.05);
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.5); font-size: 16px;
}

/* 일반 페이지 */
.content-page {
  padding: 8mm; background: white;
}
.content-page-inner {
  border: 8px solid ${brandColor};
  height: 100%;
  padding: 14mm 16mm;
  overflow: hidden;
}
.page-header {
  font-size: 11px; color: #999; font-weight: 500;
  margin-bottom: 14px; letter-spacing: 1.5px;
}
.section-num {
  display: inline-block; width: 38px; height: 38px;
  background: ${brandColor}; color: white;
  border-radius: 4px; text-align: center;
  line-height: 38px; font-size: 14px; font-weight: 700;
  margin-right: 14px; vertical-align: middle;
}
.section-title {
  font-size: 30px; font-weight: 900;
  display: flex; align-items: center;
  margin-bottom: 26px; color: #1a1a1a;
}
.section-title-text { vertical-align: middle; }
.product-image-wrap {
  width: 100%; height: 240px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 22px;
}
.product-image-wrap img {
  max-width: 80%; max-height: 100%; object-fit: contain;
}
.product-placeholder-2 {
  width: 240px; height: 240px;
  background: #F5F5F5; border: 2px dashed #DDD;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: #AAA; font-size: 13px;
}
.feature {
  margin-bottom: 18px;
}
.feature-title {
  font-size: 17px; font-weight: 900;
  color: #1a1a1a; margin-bottom: 6px;
}
.feature-sub {
  font-size: 13px; color: #555;
  padding-left: 16px; line-height: 1.7;
  margin-bottom: 3px;
}

/* 표 형식 */
table.guide-table {
  width: 100%; border-collapse: collapse;
}
table.guide-table tr { border: 1px solid #DDD; }
table.guide-table td {
  padding: 11px 13px;
  vertical-align: top;
  font-size: 12.5px; line-height: 1.65;
}
table.guide-table td.label {
  width: 130px;
  background: #FAFAFA;
  font-weight: 700;
  border-right: 1px solid #DDD;
  text-align: center;
  vertical-align: middle;
}
.alert { color: ${brandColor}; font-weight: 600; font-size: 11.5px; }
.bullet-list { list-style: none; padding: 0; }
.bullet-list li {
  padding: 2px 0; padding-left: 14px;
  position: relative;
}
.bullet-list li::before {
  content: '•'; position: absolute; left: 0;
  color: ${brandColor}; font-weight: 700;
}
.numbered-list { list-style: none; padding: 0; }
.numbered-list li { padding: 2px 0; }
.numbered-list strong { font-weight: 700; }
.req-list { list-style: none; padding: 0; }
.req-list li {
  padding: 3px 0;
  padding-left: 14px;
  position: relative;
}
.req-list li::before {
  content: '*'; position: absolute; left: 0;
  color: ${brandColor}; font-weight: 700;
}
.refs-list { list-style: none; padding: 0; }
.refs-list li {
  padding: 4px 0; line-height: 1.7;
}
.mention-section {
  margin-bottom: 14px;
}
.mention-section:last-child { margin-bottom: 0; }
.mention-section-title {
  font-weight: 700; font-size: 13px;
  margin-bottom: 6px; color: #1a1a1a;
}

/* 장면 순서 페이지 */
.scenes-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.scene-card {
  border: 1px solid #DDD;
  border-radius: 6px;
  padding: 10px;
  page-break-inside: avoid;
}
.scene-card-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
}
.scene-num {
  background: ${brandColor}; color: white;
  font-size: 11px; font-weight: 700;
  padding: 3px 8px; border-radius: 3px;
}
.scene-recommended {
  background: #1a1a1a; color: white;
  font-size: 9px; font-weight: 600;
  padding: 2px 6px; border-radius: 3px;
}
.scene-title {
  font-size: 13px; font-weight: 700;
  flex: 1;
}
.scene-image {
  width: 100%; height: 90px;
  background: #F5F5F5; border-radius: 4px;
  margin-bottom: 6px;
  display: flex; align-items: center; justify-content: center;
  color: #AAA; font-size: 11px;
  overflow: hidden;
}
.scene-image img {
  width: 100%; height: 100%; object-fit: cover;
}
.scene-note {
  font-size: 11px; color: #666;
  line-height: 1.5; min-height: 14px;
}

/* 페르소나·대본 */
.persona-page { padding: 8mm; }
.persona-content {
  border: 8px solid ${brandColor};
  height: 100%; padding: 14mm 16mm;
}
.persona-card {
  border: 1px solid #DDD; border-radius: 6px;
  padding: 14px; margin-bottom: 14px;
  page-break-inside: avoid;
}
.persona-title {
  font-size: 17px; font-weight: 900;
  margin-bottom: 4px;
}
.persona-sub {
  font-size: 12px; color: #666;
  margin-bottom: 10px;
}
.persona-info-grid {
  display: grid; grid-template-columns: 100px 1fr;
  gap: 5px 12px; margin-bottom: 10px;
  font-size: 12px;
}
.persona-info-label { color: #888; font-weight: 500; }
.script-box {
  background: #FAFAFA; padding: 12px;
  border-radius: 6px; font-size: 11.5px;
  line-height: 1.85; white-space: pre-wrap;
  border-left: 3px solid ${brandColor};
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { margin: 0; }
}

.print-btn {
  position: fixed; top: 12px; right: 12px;
  background: ${brandColor}; color: white;
  border: none; padding: 10px 18px;
  border-radius: 6px; font-size: 13px;
  font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 100;
}
@media print { .print-btn { display: none; } }
</style>
</head>
<body>

<button class="print-btn" onclick="window.print()">📄 PDF로 저장</button>

<!-- 1페이지: 표지 -->
<div class="page cover">
  <div class="cover-frame">
    <h1><span>CONTENTS</span><span>GUIDE</span></h1>
    <div class="right-text">
      <div class="product-name">${product?.name || c.name}</div>
      <div class="content-type">${c.content_type || '인스타그램 서포터즈'}</div>
    </div>
    <div class="product-img">
      ${product?.image_url
        ? `<img src="${product.image_url}" alt="${product.name||''}" crossorigin="anonymous"/>`
        : `<div class="product-placeholder">제품 이미지<br/><span style="font-size:11px;opacity:0.7">상품 등록 시 추가</span></div>`}
    </div>
  </div>
</div>

<!-- 2페이지: 제품 -->
<div class="page content-page">
  <div class="content-page-inner">
    <div class="page-header">CONTENTS GUIDE</div>
    <div class="section-title">
      <span class="section-num">01</span>
      <span class="section-title-text">제품 : ${product?.name || c.name} ${product?.url?'(link)':''}</span>
    </div>

    <div class="product-image-wrap">
      ${product?.image_url
        ? `<img src="${product.image_url}" alt="${product.name||''}" crossorigin="anonymous"/>`
        : `<div class="product-placeholder-2">제품 이미지</div>`}
    </div>

    ${(product?.features && product.features.length > 0) ? product.features.map(f => `
      <div class="feature">
        <div class="feature-title">- ${f.title}</div>
        ${f.sub.filter(Boolean).map(s => `<div class="feature-sub">ㄴ ${s}</div>`).join('')}
      </div>
    `).join('') : '<div style="color:#999;text-align:center;padding:40px">핵심 소구점이 등록되지 않았어요</div>'}
  </div>
</div>

<!-- 3페이지: 업로드 가이드 (제품 기본 정보 - 필수 요청사항·유의사항·멘션·참고사항·해시태그) -->
<div class="page content-page">
  <div class="content-page-inner">
    <div class="page-header">CONTENTS GUIDE</div>
    <div class="section-title">
      <span class="section-num">02</span>
      <span class="section-title-text">업로드 가이드</span>
    </div>

    <table class="guide-table">
      ${requests.length > 0 ? `
      <tr>
        <td class="label">필수<br/>요청사항</td>
        <td>
          <ul class="req-list">
            ${requests.map(r => `<li>${r.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</li>`).join('')}
          </ul>
        </td>
      </tr>
      `:''}
      ${cautions.length > 0 ? `
      <tr>
        <td class="label">유의사항</td>
        <td>
          <ol class="numbered-list">
            ${cautions.map((c, i) => `<li>${i+1}. ${c.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</li>`).join('')}
          </ol>
        </td>
      </tr>
      `:''}
      ${mention.length > 0 ? `
      <tr>
        <td class="label">멘션 작성<br/>가이드</td>
        <td>
          <div class="mention-section">
            <div class="mention-section-title">1. ${product?.name || '제품'} 섭취 상황 / 특장점</div>
            <ul class="bullet-list">
              ${mention.slice(0, Math.ceil(mention.length/2)).map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
          ${mention.length > 1 ? `
          <div class="mention-section">
            <div class="mention-section-title">2. ${product?.name || '제품'} 제품 소개</div>
            <ul class="bullet-list">
              ${mention.slice(Math.ceil(mention.length/2)).map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </td>
      </tr>
      `:''}
      ${refs.length > 0 ? `
      <tr>
        <td class="label">참고사항</td>
        <td>
          <ul class="refs-list">
            ${refs.map(r => `<li>${r.replace(/→/g,'<span style="color:'+brandColor+';font-weight:700"> → </span>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</li>`).join('')}
          </ul>
        </td>
      </tr>
      `:''}
      <tr>
        <td class="label">해시태그</td>
        <td style="line-height:1.8">${hashtags.length > 0 ? hashtags.join(' ') : '<span style="color:#aaa">제품 관리에서 추가</span>'}</td>
      </tr>
    </table>
  </div>
</div>

<!-- 4페이지: 캠페인별 변동 정보 -->
<div class="page content-page">
  <div class="content-page-inner">
    <div class="page-header">CONTENTS GUIDE</div>
    <div class="section-title">
      <span class="section-num">03</span>
      <span class="section-title-text">캠페인 일정 및 가이드</span>
    </div>

    <table class="guide-table">
      <tr>
        <td class="label">업로드 일정</td>
        <td>${formatDate(c.upload_date) || 'X월 Y일 (Z)'} <span class="alert">*업로드 일정 엄수</span></td>
      </tr>
      <tr>
        <td class="label">1차 콘텐츠<br/>전달 일정</td>
        <td>~ ${formatDate(c.delivery_date) || 'X월 Y일 Z요일'} <span class="alert">*전달 일정 엄수</span></td>
      </tr>
      <tr>
        <td class="label">콘텐츠 유형</td>
        <td>${c.content_type || '인스타그램 릴스 콘텐츠'} ${c.type==='influencer'?'<span style="color:#888">(*스토리 미러링)</span>':''}</td>
      </tr>
      <tr>
        <td class="label">콘텐츠 주제</td>
        <td>${c.content_topic || '<span style="color:#aaa">미입력</span>'}</td>
      </tr>
      <tr>
        <td class="label">영상 촬영<br/>가이드</td>
        <td>
          ${filming.length > 0 ? `<ul class="bullet-list">${filming.map(f => `<li>${f.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')}</li>`).join('')}</ul>` : '<span style="color:#aaa">촬영 가이드 미입력</span>'}
        </td>
      </tr>
      ${(c.description) ? `
      <tr>
        <td class="label">대본 & 장면</td>
        <td style="white-space:pre-wrap">${c.description}</td>
      </tr>
      ` : ''}
    </table>
  </div>
</div>

<!-- 5페이지: 장면 순서 -->
${scenes.length > 0 ? `
<div class="page content-page">
  <div class="content-page-inner">
    <div class="page-header">CONTENTS GUIDE</div>
    <div class="section-title">
      <span class="section-num">04</span>
      <span class="section-title-text">장면 순서</span>
    </div>
    <div style="font-size:11px;color:#666;margin-bottom:14px;line-height:1.6">
      아래 순서대로 영상을 구성해주세요. 권장 표시된 장면은 반드시 포함되어야 합니다.
    </div>

    <div class="scenes-grid">
      ${scenes.map((s, i) => `
        <div class="scene-card">
          <div class="scene-card-header">
            <span class="scene-num">순서 ${i+1}</span>
            ${s.recommended ? '<span class="scene-recommended">권장</span>' : ''}
          </div>
          <div class="scene-image">
            ${s.image_url ? `<img src="${s.image_url}" alt="" crossorigin="anonymous"/>` : '이미지 미입력'}
          </div>
          <div class="scene-title" style="margin-bottom:4px">${s.title}</div>
          <div class="scene-note">${s.note || '<span style="color:#aaa">상세 설명 미입력</span>'}</div>
        </div>
      `).join('')}
    </div>
  </div>
</div>
` : ''}

<!-- 6페이지+: 페르소나·대본 (옵션) -->
${personas.map((p, i) => `
<div class="page persona-page">
  <div class="persona-content">
    <div class="page-header">CONTENTS GUIDE</div>
    <div class="section-title">
      <span class="section-num">0${5+i}</span>
      <span class="section-title-text">페르소나 ${i+1} : ${p.title || p.persona}</span>
    </div>

    <div class="persona-card">
      <div class="persona-title">${p.title || '제목 없음'}</div>
      <div class="persona-sub">${p.persona}</div>

      <div class="persona-info-grid">
        <span class="persona-info-label">CTR 유형</span><span>${p.ctr || '—'}</span>
        <span class="persona-info-label">영상 유형</span><span>${p.vtype || '—'}</span>
        <span class="persona-info-label">고객 고통</span><span>${p.pain || '—'}</span>
        <span class="persona-info-label">확정 인플루언서</span><span>${p.confirmed || '미정'}</span>
        ${p.utm_url ? `<span class="persona-info-label">UTM 링크</span><span style="font-family:monospace;font-size:10px;color:#666;word-break:break-all">${p.utm_url}</span>` : ''}
        ${(p.tags||[]).length > 0 ? `<span class="persona-info-label">태그</span><span>${(p.tags||[]).join(' ')}</span>` : ''}
      </div>

      ${p.script ? `
        <div style="font-weight:700;font-size:13px;margin-bottom:6px;">📝 대본</div>
        <div class="script-box">${p.script}</div>
      ` : '<div style="color:#999;font-size:11.5px;padding:18px;text-align:center;background:#fafafa;border-radius:6px">대본 미작성</div>'}

      ${p.guide ? `
        <div style="font-weight:700;font-size:13px;margin-top:12px;margin-bottom:6px;">🎬 촬영 씬 가이드</div>
        <div style="font-size:11.5px;color:#555;line-height:1.7">${p.guide}</div>
      ` : ''}
    </div>
  </div>
</div>
`).join('')}

</body>
</html>`
}
