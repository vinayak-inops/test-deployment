import { NextRequest, NextResponse } from 'next/server'
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

const rawAllowedOrigin = NEXT_PUBLIC_NEXTAUTH_URL || '';

function normalizeOrigin(value: string): string {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }
    return url.origin;
  } catch {
    return '';
  }
}

const allowedOrigin = normalizeOrigin(rawAllowedOrigin);

function corsHeaders() {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  return headers;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch('http://173.65.7.58:8086/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    return NextResponse.json(data, {
      status: response.status,
      headers: corsHeaders()
    })
  } catch (error) {
    console.error('GraphQL proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to proxy GraphQL request' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders()
  })
} 
