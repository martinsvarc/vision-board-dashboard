import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: Request) {
  const cookieStore = cookies()
  const memberstack_auth = cookieStore.get('memberstack_auth')

  if (!memberstack_auth?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Parse the JWT token (Memberstack token is base64 encoded)
    const [, payload] = memberstack_auth.value.split('.')
    const decodedPayload = JSON.parse(atob(payload))
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Create or update user in Supabase
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email: decodedPayload.email,
        password: crypto.randomUUID(), // Generate random password
        options: {
          data: {
            memberstack_id: decodedPayload.sub
          }
        }
      })

      if (signUpError) {
        throw signUpError
      }

      return NextResponse.json({ user: newUser })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
