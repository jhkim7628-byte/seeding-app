import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase.from('product_settings').select('*').limit(1).single()
  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || null)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data: existing } = await supabase.from('product_settings').select('id').limit(1).single()
  let result
  if (existing?.id) {
    result = await supabase.from('product_settings').update({ ...body, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single()
  } else {
    result = await supabase.from('product_settings').insert([{ ...body, updated_at: new Date().toISOString() }]).select().single()
  }
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
  return NextResponse.json(result.data)
}
