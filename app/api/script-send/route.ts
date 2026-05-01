import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { script_id, campaign_id, influencer_ids, send_method } = body

  if (!Array.isArray(influencer_ids) || influencer_ids.length === 0) {
    return NextResponse.json({ error: '인플루언서를 선택해주세요' }, { status: 400 })
  }

  // 발송 이력 일괄 INSERT
  const records = influencer_ids.map((infId: string) => ({
    script_id,
    campaign_id,
    influencer_id: infId,
    send_method: send_method || 'pdf',
    status: 'sent',
    sent_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase.from('script_send_history').insert(records).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 대본 status를 sent로 업데이트
  await supabase.from('scripts_v4').update({ status: 'sent' }).eq('id', script_id)

  return NextResponse.json({ success: true, sent_count: data?.length || 0, records: data })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scriptId = searchParams.get('script_id')
  const campaignId = searchParams.get('campaign_id')

  let query = supabase.from('script_send_history').select('*').order('sent_at', { ascending: false })
  if (scriptId) query = query.eq('script_id', scriptId)
  if (campaignId) query = query.eq('campaign_id', campaignId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
