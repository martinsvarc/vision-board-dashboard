import { cookies } from './cookies';

export async function getMemberId(): Promise<string | null> {
  // Get memberId from URL parameters
  const params = new URLSearchParams(window.location.search);
  const memberId = params.get('memberId');
  
  if (memberId) {
    // Store in cookie for persistence
    cookies.set('member_id', memberId, {
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'Lax'
    });
    return memberId;
  }

  // Fallback to cookie if URL param is not present
  return cookies.get('member_id') || null;
}
