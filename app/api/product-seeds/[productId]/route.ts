import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { productId: string } }) {
  const { data, error } = await supabase
    .from('product_persona_seeds')
    .select('*')
    .eq('product_id', params.productId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || {})
}

export async function POST(req: NextRequest, { params }: { params: { productId: string } }) {
  const body = await req.json()

  // upsert
  const { data, error } = await supabase
    .from('product_persona_seeds')
    .upsert(
      {
        ...body,
        product_id: params.productId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'product_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
