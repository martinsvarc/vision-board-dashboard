export interface User {
  id: string;
  email: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const memberstack_auth = document.cookie.split('; ').find(row => row.startsWith('memberstack_auth='))?.split('=')[1];
    
    if (!memberstack_auth) return null;
    
    // Parse the JWT token (Memberstack token is base64 encoded)
    const [, payload] = memberstack_auth.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    
    return {
      id: decodedPayload.sub,
      email: decodedPayload.email
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
