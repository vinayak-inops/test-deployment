import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Helper: parse current mode from the URL's search params
function getCurrentMode(url: URL): string | null {
  const mode = url.searchParams.get('mode')
  if (!mode) return null
  if (['edit', 'view', 'add', 'all'].includes(mode)) return mode
  return null
}

// Helper: build the route key used in permissions (pathname or pathname?mode=...)
function buildRouteKey(url: URL, mode: string | null): string {
  if (!mode) return url.pathname
  return `${url.pathname}?mode=${mode}`
}

// Helpers: cache allowed routes in a compact cookie to avoid fetching each request
const ALLOWED_ROUTES_COOKIE = 'allowedRoutes'
const ALLOWED_ROUTES_TTL_SECONDS = 60 // short TTL to balance freshness and performance
const COOKIE_SIGNING_SECRET = process.env.NEXTAUTH_SECRET || ''

async function signValue(value: string): Promise<string | null> {
  if (!COOKIE_SIGNING_SECRET) return null
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(COOKIE_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function parseAllowedRoutesCookie(value: string | undefined): Promise<{ routes: Set<string>, exp: number } | null> {
  if (!value) return null
  try {
    const decoded = decodeURIComponent(value)
    const [expStr, payload, signature] = decoded.split(':', 3)
    if (!expStr || payload === undefined || !signature) return null
    const exp = Number(expStr)
    if (!exp || Date.now() > exp) return null
    const signedPayload = `${expStr}:${payload}`
    const expected = await signValue(signedPayload)
    if (!expected || expected !== signature) return null
    const routes = new Set<string>((payload || '').split('|').filter(Boolean))
    return { routes, exp }
  } catch {
    return null
  }
}

async function serializeAllowedRoutesCookie(routes: Set<string>): Promise<string | null> {
  if (!COOKIE_SIGNING_SECRET) return null
  const exp = Date.now() + ALLOWED_ROUTES_TTL_SECONDS * 1000
  const payload = Array.from(routes).sort().join('|')
  const signedPayload = `${exp}:${payload}`
  const signature = await signValue(signedPayload)
  if (!signature) return null
  return `${signedPayload}:${signature}`
}

// Helper: safely extract a role claim from cookie json
function extractRoleClaimFromCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue))
    const groups: string[] = Array.isArray(parsed?.groups) ? parsed.groups.map(String) : []
    const match = groups.find(g => {
      const up = g.toUpperCase()
      return up.includes('ECT-CLMS') || up.includes('ECT-CHT')
    })
    return match ?? null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)

  // Allow Next internals and static assets
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/favicon') ||
    url.pathname.startsWith('/assets') ||
    url.pathname.startsWith('/images') ||
    url.pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  // Derive mode and route key
  const mode = getCurrentMode(url)
  const routeKey = buildRouteKey(url, mode)

  // Read role info from cookie
  const roleCookie = request.cookies.get('keyclockroleinfo')?.value
  const roleClaim = extractRoleClaimFromCookie(roleCookie)

  // If no role claim, let it pass (or redirect to login/launchdesk if desired)
  if (!roleClaim) {
    return NextResponse.next()
  }

  // Try cached allowed routes cookie first
  const cached = await parseAllowedRoutesCookie(request.cookies.get(ALLOWED_ROUTES_COOKIE)?.value)
  if (cached && (cached.routes.has(routeKey) || cached.routes.has(url.pathname))) {
    return NextResponse.next()
  }

  // Fetch role permissions for this entitlement and cache briefly
  try {
    const origin = url.origin
    const resp = await fetch(`${origin}/role_permissions/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([
        { field: 'entitlementCode', value: roleClaim, operator: 'eq' }
      ]),
      // Important for middleware fetches
      cache: 'no-store',
    })

    if (!resp.ok) {
      return NextResponse.next()
    }

    const data = await resp.json()
    const role = Array.isArray(data) ? data[0] : data

    // Build an allowed routes set from role data if present
    const allowedRoutes = new Set<string>()

    // Prefer an explicit routes array if backend provides it
    if (Array.isArray(role?.routes)) {
      for (const r of role.routes) {
        if (typeof r === 'string') allowedRoutes.add(r)
        else if (r && typeof r === 'object' && typeof r.route === 'string') allowedRoutes.add(r.route)
      }
    }

    // Fallback: derive simple screen-based routes if available
    // Example shape: role.screenPermissions -> [{ serviceName, screens: [{ screenName, permissions: { myScreenView: true, ... } }] }]
    if (allowedRoutes.size === 0 && Array.isArray(role?.screenPermissions)) {
      // Allow base pathname if any screen exists; and allow mode-specific routes based on permissions
      for (const service of role.screenPermissions) {
        for (const screen of service?.screens || []) {
          const base = `/${screen.screenName}`
          allowedRoutes.add(base)
          const perms = screen.permissions || {}
          if (perms[`${screen.screenName}View`]) allowedRoutes.add(`${base}?mode=view`)
          if (perms[`${screen.screenName}Edit`]) allowedRoutes.add(`${base}?mode=edit`)
          if (perms[`${screen.screenName}Add`]) allowedRoutes.add(`${base}?mode=add`)
          if (perms[`${screen.screenName}All`]) allowedRoutes.add(`${base}?mode=all`)
        }
      }
    }

    // If we couldn't build any allowlist, skip enforcement
    if (allowedRoutes.size === 0) {
      return NextResponse.next()
    }

    // Prepare response and set cache cookie (short TTL)
    const response = NextResponse.next()
    const serializedCookie = await serializeAllowedRoutesCookie(allowedRoutes)
    if (serializedCookie) {
      response.cookies.set(ALLOWED_ROUTES_COOKIE, encodeURIComponent(serializedCookie), {
        httpOnly: true,
        sameSite: 'lax',
        secure: url.protocol === 'https:',
        path: '/',
        maxAge: ALLOWED_ROUTES_TTL_SECONDS,
      })
    }

    // Allow if the exact routeKey or base path exists
    if (allowedRoutes.has(routeKey) || allowedRoutes.has(url.pathname)) {
      return response
    }

    // Otherwise redirect to launchdesk
    return NextResponse.redirect(new URL('/launchdesk', url))
  } catch (err) {
    // On errors, do not block navigation
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next|favicon|assets|images|api).*)'],
}


