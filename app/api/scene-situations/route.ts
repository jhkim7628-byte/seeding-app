import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabase
    .from('scene_situations')
    .insert([
      {
        persona_id: body.persona_id,
        emoji: body.emoji,
        title: body.title,
        description: body.description,
        reasoning: body.reasoning,
        is_selected: body.is_selected || false,
        is_recommended: body.is_recommended || false,
      },
    ])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
