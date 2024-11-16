import { cookies } from 'next/headers'

export interface User {
  id: string;
  email: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const memberstack_auth = cookieStore.get('memberstack_auth')
    
    if (!memberstack_auth?.value) return null
    
    // Parse the JWT token (Memberstack token is base64 encoded)
    const [, payload] = memberstack_auth.value.split('.')
    const decodedPayload = JSON.parse(atob(payload))
    
    return {
      id: decodedPayload.sub,
      email: decodedPayload.email
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}
