import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('vision_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching vision items:', error)
    return NextResponse.json({ error: 'Failed to fetch vision items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, item } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vision_items')
      .insert([{
        user_id: userId,
        src: item.src,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        z_index: item.zIndex,
        aspect_ratio: item.aspectRatio
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error saving vision item:', error)
    return NextResponse.json({ error: 'Failed to save vision item' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { itemId, userId, updates } = await request.json()

    const { data, error } = await supabase
      .from('vision_items')
      .update({
        ...(updates.x !== undefined && { x: updates.x }),
        ...(updates.y !== undefined && { y: updates.y }),
        ...(updates.width !== undefined && { width: updates.width }),
        ...(updates.height !== undefined && { height: updates.height }),
        ...(updates.zIndex !== undefined && { z_index: updates.zIndex })
      })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating vision item:', error)
    return NextResponse.json({ error: 'Failed to update vision item' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')
  const userId = searchParams.get('userId')

  if (!itemId || !userId) {
    return NextResponse.json({ error: 'Item ID and User ID required' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('vision_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vision item:', error)
    return NextResponse.json({ error: 'Failed to delete vision item' }, { status: 500 })
  }
}
