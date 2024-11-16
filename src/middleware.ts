import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get memberId from query params
  const memberId = request.nextUrl.searchParams.get('memberId')
  
  // If no memberId, redirect to error page
  if (!memberId) {
    return NextResponse.redirect(new URL('/error', request.url))
  }

  // Add CORS headers
  const response = NextResponse.next()
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

export const config = {
  matcher: '/:path*',
}
