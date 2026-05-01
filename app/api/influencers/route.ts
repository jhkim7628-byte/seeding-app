import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaign_id')

  if (campaignId) {
    // 특정 캠페인의 인플루언서만 조회
    // campaign_influencers 테이블이 있다고 가정 (없으면 전체 반환)
    const { data: links, error: linksError } = await supabase
      .from('campaign_influencers')
      .select('influencer_id')
      .eq('campaign_id', campaignId)

    if (linksError || !links || links.length === 0) {
      // 폴백: 전체 인플루언서 반환 (campaign_influencers 테이블이 없는 경우)
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return NextResponse.json([], { status: 200 })
      return NextResponse.json(data || [])
    }

    const influencerIds = links.map((l) => l.influencer_id)
    const { data, error } = await supabase.from('influencers').select('*').in('id', influencerIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  }

  // 전체 인플루언서
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('influencers').insert([body]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
