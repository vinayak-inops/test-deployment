import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { getToken } from 'next-auth/jwt';

// Set default NODE_ENV to 'production' if not present
const NODE_ENV = process.env.NODE_ENV || 'production';
const isProduction = NODE_ENV === 'production';

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

const rawOrigins = process.env.NEXT_PUBLIC_NEXTAUTH_URL || '';
const primaryOrigin = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)[0] || '';
const allowedCorsOrigin = normalizeOrigin(primaryOrigin);

function parseJwtPayload(tokenValue: string): Record<string, any> | null {
  const tokenParts = tokenValue.split('.');
  if (tokenParts.length !== 3) {
    return null;
  }

  try {
    const payload = tokenParts[1];
    const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = base64Payload + '='.repeat((4 - (base64Payload.length % 4)) % 4);
    const decoded = Buffer.from(paddedPayload, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed as Record<string, any>;
  } catch {
    return null;
  }
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Vary', 'Origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (allowedCorsOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedCorsOrigin);
    response.headers.set('Content-Security-Policy', `frame-ancestors 'self' ${allowedCorsOrigin}`);
  } else {
    response.headers.delete('Access-Control-Allow-Origin');
    response.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
  }
}

// Define app configurations with container names for Docker networking
const APP_CONFIGS = {
  master: {
    port: `${process.env.NEXT_PUBLIC_MASTER_URL}`,
    path: '/master',
    container: 'inops-master-app'
  },
  dashboard: {
    port: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}`,
    path: '/dashboard',
    container: 'inops-dashboard-app',
    healthCheck: '/dashboard/api/health'  // Add explicit health check path
  },
  workflow: {
    port: `${process.env.NEXT_PUBLIC_WORKFLOW_URL}`,
    path: '/workflow',
    container: 'inops-workflow-app'
  },
  reports: {
    port: `${process.env.NEXT_PUBLIC_REPORTS_URL}`,
    path: '/reports',
    container: 'inops-reports-app',
    healthCheck: '/reports/api/health'  
  },
  leave: {
    port: `${process.env.NEXT_PUBLIC_LEAVE_URL}`,
    path: '/leave',
    container: 'inops-leave-app'
  },
  wages: {
    port: `${process.env.NEXT_PUBLIC_WAGES_URL}`,
    path: '/wages',
    container: 'inops-wages-app'
  },
  muster: {
    port: `${process.env.NEXT_PUBLIC_MUSTER_URL}`,
    path: '/muster',
    container: 'inops-muster-app'
  },
  otapplication: {
    port: `${process.env.NEXT_PUBLIC_OTAPPLICATION_URL}`,
    path: '/application',
    container: 'inops-otapplication-app'
  },
  aiapplication: {
    port: `${process.env.NEXT_PUBLIC_AIAPPLICATION_URL}`,
    path: '/aiapplication',
    container: 'inops-aiapplication-app'
  },
  bgm: {
    port: `${process.env.NEXT_PUBLIC_BGM_URL}`,
    path: '/bgm',
    container: 'inops-bgm-app'
  },
  ai: {
    port: `${process.env.NEXT_PUBLIC_AI_URL}`,
    path: '/ai',
    container: 'inops-ai-app'
  },
  challan: {
    port: `${process.env.NEXT_PUBLIC_CHALLAN_URL}`,
    path: '/challan',
    container: 'inops-challan-app'
  }
} as const;

// Track if master app is ready
let isMasterAppReady = false;

// Track launchdesk loading attempts to prevent infinite loops
// Entries are automatically cleaned up on timeout or success
const launchdeskLoadingAttempts = new Map<string, { count: number; startTime: number }>();

// Helper function to calculate cookie maxAge from token expiry
function getCookieMaxAge(tokenExpiresAt: number | undefined): number {
  if (!tokenExpiresAt) {
    // Fallback to 7 days if no expiry info
    return 7 * 24 * 60 * 60;
  }
  
  // token.expires_at is in seconds, Date.now() is in milliseconds
  const expiresAtMs = tokenExpiresAt * 1000;
  const nowMs = Date.now();
  const remainingSeconds = Math.floor((expiresAtMs - nowMs) / 1000);
  
  // Ensure maxAge is at least 0 (cookie expires immediately if token already expired)
  // But this shouldn't happen as we check expiry before this
  return Math.max(0, remainingSeconds);
}

// Helper function to set cookie with plain JSON format (not URL-encoded)
// Supports both HTTP and HTTPS - sets secure flag based on protocol
function setRoleCookie(response: NextResponse, roleInfo: any, tokenExpiresAt: number | undefined, request: NextRequestWithAuth) {
  try {
    // Store as plain JSON string (not URL-encoded) for readability
    const jsonValue = JSON.stringify(roleInfo);
    
    // Delete old cookie first
    response.cookies.delete('keyclockroleinfo');
    
    // Determine secure flag based on request protocol
    // HTTPS: secure=true, HTTP: secure=false (allows both)
    const isSecure = request.nextUrl.protocol === 'https:';
    
    // Set new cookie with proper options
    // No domain restrictions - works on any IP/domain
    const cookieOptions = {
      path: '/',
      maxAge: getCookieMaxAge(tokenExpiresAt),
      sameSite: 'lax' as const,
      httpOnly: false, // Allow client-side access
      secure: isSecure, // true for HTTPS, false for HTTP (supports both)
    };

    
    // Store as plain JSON (Next.js cookies API handles encoding automatically if needed)
    response.cookies.set('keyclockroleinfo', jsonValue, cookieOptions);
    
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to create redirect URL with correct host
function createRedirectUrl(request: NextRequestWithAuth, pathname: string): URL {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = ''; // Clear query params
  
  // Use the actual request host instead of NEXT_PUBLIC_NEXTAUTH_URL to avoid IP mismatches
  // This ensures redirects work correctly when accessing via different IPs
  const requestHost = request.headers.get('host') || request.nextUrl.host;
  if (requestHost) {
    url.host = requestHost;
    // Preserve the protocol from the request
    url.protocol = request.nextUrl.protocol;
  }
  
  return url;
}

function isSecureRequest(request: NextRequestWithAuth): boolean {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  return request.nextUrl.protocol === 'https:' || forwardedProto === 'https';
}

// Helper function to create loading response
// Note: Removed auto-refresh to prevent redirect loops. Client-side will handle retry.
function createLoadingResponse(message: string, retryAfter: number = 5, request?: NextRequestWithAuth) {
  // Build the current URL for the redirect to avoid IP mismatches
  const currentUrl = request ? request.nextUrl.origin : '';
  const refreshUrl = currentUrl ? `${currentUrl}/launchdesk` : '/launchdesk';
  
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Loading...</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    p {
      margin: 0;
      opacity: 0.9;
      font-size: 1rem;
    }
    .retry-button {
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid white;
      border-radius: 0.5rem;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.3s;
    }
    .retry-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  </style>
  <script>
    // Use JavaScript redirect to avoid meta refresh loops
    let retryCount = 0;
    const maxRetries = 12; // 12 retries * 5 seconds = 60 seconds total
    
    function retry() {
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(() => {
          window.location.href = '${refreshUrl}';
        }, ${retryAfter * 1000});
      } else {
        document.querySelector('.retry-button').style.display = 'block';
        document.querySelector('.message').textContent = 'Loading timeout. Please refresh manually.';
      }
    }
    
    // Start retry on page load
    window.addEventListener('load', retry);
  </script>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Loading Launchdesk...</h1>
    <p class="message">${message}</p>
    <button class="retry-button" onclick="window.location.href='${refreshUrl}'" style="display: none;">Retry Now</button>
  </div>
</body>
</html>`,
    {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': retryAfter.toString(),
      }
    }
  );
}
  
function getAppHost(containerName: string, port: string): string {
  // Default to true if DOCKER_ENV is not explicitly set to 'false'
  const isDocker = process.env.DOCKER_ENV !== 'false';
  
  if (isDocker) {
    // In Docker, extract IP address and port from environment URL
    // Scenario: Public IP on WiFi device, apps deployed on PC with different IP
    // For internal communication, use the IP address from env var (PC's local IP)
    // This works when accessing from outside the PC via public IP
    // Example: "http://192.168.1.37:3001" -> use "http://192.168.1.37:3001" for internal communication
    
    // Validate that port/env var is provided
    if (!port || port.trim() === '') {
      return `http://localhost:3000`; // Safe fallback
    }
    
    let ipAddress = 'localhost'; // default fallback
    let portNumber = '3000'; // default fallback
    
    try {
      // Try parsing as URL first
      const url = new URL(port);
      ipAddress = url.hostname; // Extract IP address (e.g., "192.168.1.37" or "117.198.96.99")
      portNumber = url.port || (url.protocol === 'https:' ? '443' : '80');
      
      // Validate extracted values
      if (!ipAddress || ipAddress === 'undefined' || ipAddress === 'null') {
        ipAddress = 'localhost';
      }
      if (!portNumber || portNumber === '0') {
        portNumber = '3000';
      }
    } catch (error) {
      // If not a valid URL, try to extract IP and port from string
      // Handles formats like: "http://192.168.1.37:3001", "http://117.198.96.99:3001"
      const urlMatch = port.match(/^(https?:\/\/)?([\d.]+):(\d+)/);
      if (urlMatch) {
        ipAddress = urlMatch[2]; // Extract IP address
        portNumber = urlMatch[3]; // Extract port
      } else {
        // If only port is provided, try to extract it
        const portMatch = port.match(/:(\d+)/);
        if (portMatch) {
          portNumber = portMatch[1];
        } else if (/^\d+$/.test(port)) {
          portNumber = port;
        } else {
        }
      }
    }
    
    // Use the IP address from environment variable for internal communication
    // This allows containers to communicate via the PC's IP address
    // Works when accessing from outside via public IP
    const result = `http://${ipAddress}:${portNumber}`;
    
    // Log in production only if there's an issue (not for every request)
    if (ipAddress === 'localhost' && NODE_ENV === 'production') {
    }
    
    return result;
  }
  
  // Outside Docker, use the provided port/URL as-is (for local development)
  return port;
}

// Function to handle app routing
async function handleAppRouting(request: NextRequestWithAuth) {
  // Special handling for master app routes
  if (request.nextUrl.pathname.startsWith('/master')) {
    if (!isMasterAppReady) {
      try {
        const masterConfig = APP_CONFIGS.master;
        const masterHost = getAppHost(masterConfig.container, masterConfig.port);
        const healthCheckUrl = `${masterHost}/master`;
        
        // Log for debugging (only in development or when explicitly enabled)
        if (process.env.DOCKER_ENV === 'true' && NODE_ENV !== 'production') {
        }
        
        // Try to connect to master app
        const response = await fetch(healthCheckUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // Increased timeout for Docker networking
        });
        
        if (response.ok) {
          isMasterAppReady = true;
          // Only log success in development to reduce production log noise
          if (process.env.DOCKER_ENV === 'true' && NODE_ENV !== 'production') {
          }
        } else {
          // If master app is not ready, return a retry response
          const retryResponse = new NextResponse(
            JSON.stringify({
              status: 'loading',
              message: 'Master application is starting up, please refresh in a few seconds...'
            }),
            {
              status: 503,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '5'
              }
            }
          );
          applySecurityHeaders(retryResponse);
          return retryResponse;
        }
      } catch (error) {
        const masterConfig = APP_CONFIGS.master;
        const masterHost = getAppHost(masterConfig.container, masterConfig.port);
        // If connection fails, return retry response
        const retryResponse = new NextResponse(
          JSON.stringify({
            status: 'loading',
            message: 'Master application is starting up, please refresh in a few seconds...'
          }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '5'
            }
          }
        );
        applySecurityHeaders(retryResponse);
        return retryResponse;
      }
    }

    // Create the URL for the master application
    const masterConfig = APP_CONFIGS.master;
    const masterHost = getAppHost(masterConfig.container, masterConfig.port);
    
    try {
      const masterUrl = new URL(request.nextUrl.pathname, masterHost);
      masterUrl.search = request.nextUrl.search;

      // Log for debugging (only in development to reduce production log noise)
      if (process.env.DOCKER_ENV === 'true' && NODE_ENV !== 'production') {
      }

      // Add necessary headers for the master app
      const response = NextResponse.rewrite(masterUrl);
      applySecurityHeaders(response);

      return response;
    } catch (error) {
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to route to master application'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle dashboard app routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      const dashboardConfig = APP_CONFIGS.dashboard;
      const dashboardHost = getAppHost(dashboardConfig.container, dashboardConfig.port);
      const targetUrl = new URL(request.nextUrl.pathname, dashboardHost);
      targetUrl.search = request.nextUrl.search;

      if (process.env.DOCKER_ENV === 'true' && NODE_ENV !== 'production') {
      }

      const response = NextResponse.rewrite(targetUrl, {
        headers: {
          'X-Forwarded-Host': request.headers.get('host') || '',
          'X-Forwarded-Proto': 'http',
          'X-Real-IP': request.headers.get('x-real-ip') || '',
          'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        }
      });

      applySecurityHeaders(response);

      return response;
    } catch (error) {
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to route to dashboard application'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle reports app routes
  if (request.nextUrl.pathname.startsWith('/reports')) {
    try {
      const reportsConfig = APP_CONFIGS.reports;
      const reportsHost = getAppHost(reportsConfig.container, reportsConfig.port);
      const targetUrl = new URL(request.nextUrl.pathname, reportsHost);
      targetUrl.search = request.nextUrl.search;

      if (process.env.DOCKER_ENV === 'true' && NODE_ENV !== 'production') {
      }

      const response = NextResponse.rewrite(targetUrl, {
        headers: {
          'X-Forwarded-Host': request.headers.get('host') || '',
          'X-Forwarded-Proto': 'http',
          'X-Real-IP': request.headers.get('x-real-ip') || '',
          'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
        }
      });

      applySecurityHeaders(response);

      return response;
    } catch (error) {
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to route to reports application'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle other app routes
  for (const [appName, config] of Object.entries(APP_CONFIGS)) {
    if (appName !== 'master' && appName !== 'dashboard' && appName !== 'reports' && request.nextUrl.pathname.startsWith(config.path)) {
      try {
        const appHost = getAppHost(config.container, config.port);
        const targetUrl = new URL(request.nextUrl.pathname, appHost);
        targetUrl.search = request.nextUrl.search;

        if (process.env.DOCKER_ENV === 'true' && NODE_ENV !== 'production') {
        }

        const response = NextResponse.rewrite(targetUrl);
        applySecurityHeaders(response);

        return response;
      } catch (error) {
        return new NextResponse(
          JSON.stringify({
            error: 'Internal Server Error',
            message: `Failed to route to ${appName} application`
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  return NextResponse.next();
}

// Export the combined middleware with authentication
export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    // Handle invalid login URLs
    if (request.nextUrl.pathname.startsWith('/login/') || request.nextUrl.pathname === '/login6') {
      return NextResponse.redirect(createRedirectUrl(request, '/login'));
    }

    // Allow access to public resources without authentication (exclude '/')
    if (
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname === '/favicon.ico' ||
      request.nextUrl.pathname.startsWith('/public') ||
      request.nextUrl.pathname.startsWith('/images') || // Allow image folder access
      request.nextUrl.pathname === '/login' || // Allow access to custom login page
      request.nextUrl.pathname === '/logout' ||
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname === '/auth-controller' || // Allow access to auth-controller page without login
      request.nextUrl.pathname === '/debug' || // Allow access to debug page
      request.nextUrl.pathname.startsWith('/debug') // Allow access to debug page and sub-routes
    ) {
      return NextResponse.next();
    }

    // Check for token and expiry
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: isSecureRequest(request),
    });

    if (!token || !token.expires_at) {
      // No token or no expiry info, redirect to login
      return NextResponse.redirect(createRedirectUrl(request, '/login'));
    }
    if (token.expires_at * 1000 < Date.now()) {
      // Token expired, redirect to login
      return NextResponse.redirect(createRedirectUrl(request, '/login'));
    }

    // Additional validation for Keycloak token information
    if (!token.accessToken || !token.idToken) {
      return NextResponse.redirect(createRedirectUrl(request, '/login'));
    }

    // Validate token structure (basic JWT validation)
    let accessTokenPayload: any = undefined;
    let idTokenPayload: any = undefined;
    if (token.accessToken && typeof token.accessToken === 'string') {
      accessTokenPayload = parseJwtPayload(token.accessToken);
      if (!accessTokenPayload?.sub || !accessTokenPayload?.iss || !accessTokenPayload?.aud) {
        return NextResponse.redirect(createRedirectUrl(request, '/login'));
      }
    } else {
      return NextResponse.redirect(createRedirectUrl(request, '/login'));
    }

    if (token.idToken && typeof token.idToken === 'string') {
      idTokenPayload = parseJwtPayload(token.idToken);
      if (!idTokenPayload?.sub || !idTokenPayload?.iss || !idTokenPayload?.aud) {
        return NextResponse.redirect(createRedirectUrl(request, '/login'));
      }
    } else {
      return NextResponse.redirect(createRedirectUrl(request, '/login'));
    }

    // After login, if role cookie is missing or invalid, auto-create it from token
    const roleCookie = request.cookies.get('keyclockroleinfo')?.value;
    const allowedWithoutRole = new Set(['/']);
    
    // Check if role cookie exists and is valid
    let hasValidRole = false;
    let parsedRoleInfo: any = undefined;
    let isNewToken = false;
    
    if (roleCookie && roleCookie !== '[]') {
        try {
            // Support both encoded and plain JSON cookie values (try plain first, then decode if needed)
            let cookieValue = roleCookie;
            // Try to parse as plain JSON first
            try {
                parsedRoleInfo = JSON.parse(cookieValue);
            } catch {
                // If plain JSON fails, try URL-decoding first
                try {
                    cookieValue = decodeURIComponent(roleCookie);
                    parsedRoleInfo = JSON.parse(cookieValue);
                } catch {
                    // If both fail, use original value
                    parsedRoleInfo = JSON.parse(roleCookie);
                }
            }
            
            // Check if this is a new token (different user or refreshed token)
            const cookieSub = parsedRoleInfo?.sub;
            const tokenSub = token.sub;
            const cookieExpiresAt = parsedRoleInfo?.tokenExpiresAt;
            const tokenExpiresAt = token.expires_at;
            
            // Detect new token: different user or newer expiry (token refresh)
            if (cookieSub !== tokenSub || (tokenExpiresAt && (!cookieExpiresAt || tokenExpiresAt > cookieExpiresAt))) {
                isNewToken = true;
                
            }
            
            // Validate that the cookie contains essential role information
            hasValidRole = parsedRoleInfo && 
                          parsedRoleInfo.roleType && 
                          typeof parsedRoleInfo.roleType === 'string' && 
                          parsedRoleInfo.selectedAt &&
                          parsedRoleInfo.roleType.trim().length > 0 &&
                          !isNewToken; // Invalidate if it's a new token
        } catch (error) {
            hasValidRole = false;
        }
    }
    
    // If new token detected, remove old cookie and create new one
    if (isNewToken) {
        // Extract roles/groups from new token
        const tokenGroups = (token.groups as string[]) || [];
        const tokenRoles = (token.roles as string[]) || [];
        const realmRoles = token.realm_access?.roles || [];
        
        // Find role that matches entitlement pattern (ECT-CLMS or ECT-CHT)
        const allRoles = [...tokenGroups, ...tokenRoles, ...realmRoles];
        const entitlementRole = allRoles.find((role: string) => {
            const upperRole = String(role).toUpperCase();
            return upperRole.includes("ECT-CLMS") || upperRole.includes("ECT-CHT");
        }) || allRoles[0] || 'user';
        
        // Create new role info payload from new token
        const newRoleInfo = {
            sub: token.sub,
            email: token.email,
            preferred_username: token.preferred_username,
            roles: tokenRoles,
            groups: tokenGroups,
            realm_access: token.realm_access,
            org: (token as any).org ?? accessTokenPayload?.org ?? idTokenPayload?.org,
            employeeId: (token as any).employeeId ?? accessTokenPayload?.employeeId ?? idTokenPayload?.employeeId,
            roleType: entitlementRole,
            selectedAt: new Date().toISOString(),
            tokenExpiresAt: token.expires_at // Store token expiry for future comparison
        };
        
        // Update parsedRoleInfo for use in rest of middleware
        parsedRoleInfo = newRoleInfo;
        hasValidRole = true;
        
        // Note: We'll delete and set the cookie on the final response
        // This ensures the cookie is updated regardless of which path we take
    }
    
    // If no valid role cookie, auto-create it from token and redirect to launchdesk
    if (!hasValidRole && !allowedWithoutRole.has(request.nextUrl.pathname)) {
        // Extract roles/groups from token
        const tokenGroups = (token.groups as string[]) || [];
        const tokenRoles = (token.roles as string[]) || [];
        const realmRoles = token.realm_access?.roles || [];
        
        // Find role that matches entitlement pattern (ECT-CLMS or ECT-CHT)
        const allRoles = [...tokenGroups, ...tokenRoles, ...realmRoles];
        const entitlementRole = allRoles.find((role: string) => {
            const upperRole = String(role).toUpperCase();
            return upperRole.includes("ECT-CLMS") || upperRole.includes("ECT-CHT");
        }) || allRoles[0] || 'user';
        
        // Create role info payload
        const roleInfo = {
            sub: token.sub,
            email: token.email,
            preferred_username: token.preferred_username,
            roles: tokenRoles,
            groups: tokenGroups,
            realm_access: token.realm_access,
            org: (token as any).org ?? accessTokenPayload?.org ?? idTokenPayload?.org,
            employeeId: (token as any).employeeId ?? accessTokenPayload?.employeeId ?? idTokenPayload?.employeeId,
            roleType: entitlementRole,
            selectedAt: new Date().toISOString(),
            tokenExpiresAt: token.expires_at // Store token expiry for future comparison
        };
        
        // Create response and set cookie
        // Use helper to properly construct redirect URL with correct host
        const response = NextResponse.redirect(createRedirectUrl(request, '/launchdesk'));
        setRoleCookie(response, roleInfo, token.expires_at, request);
        
        return response;
    }
    
    // Special handling for /launchdesk - prevent redirect loops and add timeout
    if (request.nextUrl.pathname === '/launchdesk') {
        const sessionId = token.sub || request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        const attemptInfo = launchdeskLoadingAttempts.get(sessionId);
        const TIMEOUT_MS = 60 * 1000; // 1 minute timeout
        
        // Check if we're in a loading/retry cycle
        if (attemptInfo) {
            const elapsed = now - attemptInfo.startTime;
            
            // If timeout exceeded, redirect to login
            if (elapsed > TIMEOUT_MS) {
                launchdeskLoadingAttempts.delete(sessionId);
                return NextResponse.redirect(createRedirectUrl(request, '/login'));
            }
            
            // If still within timeout and no valid role, show loading page
            if (!hasValidRole) {
                const remainingSeconds = Math.ceil((TIMEOUT_MS - elapsed) / 1000);
                return createLoadingResponse(
                    `Please wait while we set up your session... (${remainingSeconds}s remaining)`,
                    5,
                    request
                );
            }
            
            // If we now have a valid role, clear the attempt tracking
            launchdeskLoadingAttempts.delete(sessionId);
        }
        
        // If no valid role and not in retry cycle, start tracking and create role
        if (!hasValidRole) {
            // Track this attempt
            launchdeskLoadingAttempts.set(sessionId, {
                count: 1,
                startTime: now
            });
            
            // Extract roles/groups from token
            const tokenGroups = (token.groups as string[]) || [];
            const tokenRoles = (token.roles as string[]) || [];
            const realmRoles = token.realm_access?.roles || [];
            
            // Find role that matches entitlement pattern
            const allRoles = [...tokenGroups, ...tokenRoles, ...realmRoles];
            const entitlementRole = allRoles.find((role: string) => {
                const upperRole = String(role).toUpperCase();
                return upperRole.includes("ECT-CLMS") || upperRole.includes("ECT-CHT");
            }) || allRoles[0] || 'user';
            
            // Create role info payload
            const roleInfo = {
                sub: token.sub,
                email: token.email,
                preferred_username: token.preferred_username,
                roles: tokenRoles,
                groups: tokenGroups,
                realm_access: token.realm_access,
                org: (token as any).org ?? accessTokenPayload?.org ?? idTokenPayload?.org,
                employeeId: (token as any).employeeId ?? accessTokenPayload?.employeeId ?? idTokenPayload?.employeeId,
                roleType: entitlementRole,
                selectedAt: new Date().toISOString(),
                tokenExpiresAt: token.expires_at // Store token expiry for future comparison
            };
            
            // Set cookie and show loading page (don't redirect to avoid loop)
            const response = createLoadingResponse(
                'Setting up your session, please wait...',
                3,
                request
            );
            setRoleCookie(response, roleInfo, token.expires_at, request);
            
            return response;
        }
    }

    // Additional validation for /launchdesk - ensure Keycloak user information exists
    if (request.nextUrl.pathname === '/launchdesk') {
        // Check if token has required Keycloak user information
        if (!token.preferred_username && !token.email && !token.name) {
            return NextResponse.redirect(createRedirectUrl(request, '/login'));
        }

        // Validate that the user has at least one valid group or role
        const hasGroups = token.groups && Array.isArray(token.groups) && token.groups.length > 0;
        const hasRoles = token.roles && Array.isArray(token.roles) && token.roles.length > 0;
        const hasRealmAccess = token.realm_access && token.realm_access.roles && Array.isArray(token.realm_access.roles) && token.realm_access.roles.length > 0;
        
        if (!hasGroups && !hasRoles && !hasRealmAccess) {
            // Since no roles found, create a default 'user' role and allow access
            const roleInfo = {
                sub: token.sub,
                email: token.email,
                preferred_username: token.preferred_username,
                roles: [],
                groups: [],
                realm_access: token.realm_access || {},
                org: (token as any).org ?? accessTokenPayload?.org ?? idTokenPayload?.org,
                employeeId: (token as any).employeeId ?? accessTokenPayload?.employeeId ?? idTokenPayload?.employeeId,
                roleType: 'user',
                selectedAt: new Date().toISOString(),
                tokenExpiresAt: token.expires_at // Store token expiry for future comparison
            };
            
            const response = NextResponse.next();
            setRoleCookie(response, roleInfo, token.expires_at, request);
            
            return response;
        }
        
        // If we have valid role and all validations passed, allow access to /launchdesk
        // Return early to avoid going through app routing (launchdesk is in main app, not proxied)
        if (hasValidRole) {
            const response = NextResponse.next();
            // If new token was detected, update the cookie
            if (isNewToken && parsedRoleInfo) {
                setRoleCookie(response, parsedRoleInfo, token.expires_at, request);
            }
            return response;
        }
    }

    // Enrich existing role cookie with org and employeeId if missing
    const needsEnrichment = !!parsedRoleInfo && (
      parsedRoleInfo.org === undefined || parsedRoleInfo.org === null || String(parsedRoleInfo.org).trim() === '' ||
      parsedRoleInfo.employeeId === undefined || parsedRoleInfo.employeeId === null || String(parsedRoleInfo.employeeId).trim() === ''
    );

    // Guard: if both org and employeeId are missing, disallow '/' by redirecting to login
    const effectiveOrg = (parsedRoleInfo?.org ?? (token as any).org ?? accessTokenPayload?.org ?? idTokenPayload?.org);
    const effectiveEmployeeId = (parsedRoleInfo?.employeeId ?? (token as any).employeeId ?? accessTokenPayload?.employeeId ?? idTokenPayload?.employeeId);
    const bothMissing = (!effectiveOrg || String(effectiveOrg).trim() === '') && (!effectiveEmployeeId || String(effectiveEmployeeId).trim() === '');
    if (bothMissing && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(createRedirectUrl(request, '/login'));
    }

    // Then handle app routing
    const routedResponse = await handleAppRouting(request);

    // If new token was detected, update the cookie on the response
    if (isNewToken && parsedRoleInfo) {
      setRoleCookie(routedResponse, parsedRoleInfo, token.expires_at, request);
    } else if (needsEnrichment) {
      const enrichedRoleInfo = {
        ...parsedRoleInfo,
        org: parsedRoleInfo?.org ?? (token as any).org ?? accessTokenPayload?.org ?? idTokenPayload?.org,
        employeeId: parsedRoleInfo?.employeeId ?? (token as any).employeeId ?? accessTokenPayload?.employeeId ?? idTokenPayload?.employeeId,
        tokenExpiresAt: token.expires_at // Update token expiry for future comparison
      };

      setRoleCookie(routedResponse, enrichedRoleInfo, token.expires_at, request);
    }

    return routedResponse;
  },
  {
    cookies: {
      sessionToken: {
        name: isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      },
    },
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to main page, images, and debug page without authentication
        if (req.nextUrl.pathname === '/' || 
            req.nextUrl.pathname.startsWith('/images') ||
            req.nextUrl.pathname === '/debug' ||
            req.nextUrl.pathname.startsWith('/debug')) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login", // Redirect to custom login page instead of directly to Keycloak
    },
  }
);

// Update matcher to catch all routes that need authentication and routing
export const config = {
  matcher: [
    // Auth matcher (protect all routes except auth-related ones, login page, main page, images, debug page, and auth-controller page)
    "/((?!$|api/auth|_next/static|_next/image|favicon.ico|public|images|debug|auth-controller).*)",
    // App routing matcher
    '/master/:path*',
    '/master',
    '/dashboard/:path*',
    '/dashboard',
    '/workflow/:path*',
    '/workflow',
    '/reports/:path*',
    '/reports',
    '/leave/:path*',
    '/leave',
    '/challan/:path*',
    '/challan'
  ]
};
