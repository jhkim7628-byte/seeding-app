import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // 대본에 campaign_id 업데이트
  if (body.script_id && body.campaign_id) {
    await supabase
      .from('scripts_v4')
      .update({ campaign_id: body.campaign_id, status: 'finalized' })
      .eq('id', body.script_id)
  }

  // 연결 테이블에 추가 (다대다)
  const { data, error } = await supabase
    .from('script_campaign_links')
    .upsert(
      {
        script_id: body.script_id,
        campaign_id: body.campaign_id,
      },
      { onConflict: 'script_id,campaign_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const scriptId = searchParams.get('script_id')
  const campaignId = searchParams.get('campaign_id')

  let query = supabase.from('script_campaign_links').select('*')
  if (scriptId) query = query.eq('script_id', scriptId)
  if (campaignId) query = query.eq('campaign_id', campaignId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
