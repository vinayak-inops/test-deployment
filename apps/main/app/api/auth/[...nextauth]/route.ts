import NextAuth from "next-auth";
import { options } from "./options";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

process.env.AUTH_TRUST_HOST ??= "true";

const handler = NextAuth(options);

const isSecureRequest = (req: NextRequest) => {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  return req.nextUrl.protocol === "https:" || forwardedProto === "https";
};

const getPublicOrigin = (req: NextRequest, url: URL) => {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const protocol = forwardedProto === "http" ? "http" : "https";
    return `${protocol}://${forwardedHost}`;
  }

  return url.origin;
};

// Wrap the handler to intercept OAuthCallback errors and auto-retry with existing token
async function wrappedHandler(
  req: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  // Check if this is an error request with OAuthCallback error
  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  const pathname = url.pathname;
  const callbackUrl = url.searchParams.get("callbackUrl");

  // If user opens Keycloak sign-in in the browser (GET),
  // avoid showing NextAuth's "Sign in with Keycloak" screen.
  // Return a tiny HTML page that auto-POSTs to NextAuth sign-in (faster than loading a React page).
  const isKeycloakSignIn =
    pathname === "/api/auth/signin/keycloak" || pathname.endsWith("/signin/keycloak");
  if (isKeycloakSignIn && req.method === "GET" && !error) {
    const safeCallbackUrlRaw = callbackUrl || "/launchdesk";
    const safeCallbackUrl =
      safeCallbackUrlRaw.startsWith("/") && !safeCallbackUrlRaw.startsWith("//")
        ? safeCallbackUrlRaw
        : "/launchdesk";

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Redirecting…</title>
    <meta http-equiv="cache-control" content="no-store" />
    <style>
      body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#001233,#002366,#001233);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111}
      .card{background:#fff;border-radius:16px;padding:32px 24px;box-shadow:0 20px 40px rgba(15,23,42,.4);max-width:360px;width:100%;text-align:center}
      .spinner-wrap{width:80px;height:80px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center}
      .spinner{width:48px;height:48px;border-radius:9999px;border:4px solid #dbeafe;border-top-color:#2563eb;animation:spin .9s linear infinite}
      .title{font-size:1.4rem;font-weight:600;color:#111;margin-bottom:8px}
      .subtitle{font-size:.9rem;color:#4b5563;display:flex;align-items:center;justify-content:center;gap:8px}
      .dot{width:8px;height:8px;border-radius:9999px;background:#22c55e}
      .manual{margin-top:16px;border:1px solid #d1d5db;background:#fff;border-radius:9999px;padding:8px 14px;cursor:pointer;font-size:.85rem;color:#1f2933}
      @keyframes spin{to{transform:rotate(360deg)}}
    </style>
  </head>
  <body>
    <div class="card">
      <div class="spinner-wrap"><div class="spinner"></div></div>
      <div class="title">Signing you in…</div>
      <div class="subtitle"><span class="dot"></span><span>Connecting securely to your account</span></div>
      <form id="fallback" method="post" action="/api/auth/signin/keycloak" style="display:none">
        <input type="hidden" name="csrfToken" value="" />
        <input type="hidden" name="callbackUrl" value="${safeCallbackUrl.replace(/"/g, "&quot;")}" />
        <noscript>
          <button type="submit">Continue</button>
        </noscript>
      </form>
      <button id="manual" type="button" class="manual" style="display:none" onclick="document.getElementById('fallback').style.display='block';document.getElementById('fallback').submit();">Continue</button>
    </div>
    <script>
      (async function () {
        try {
          const res = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
          const data = await res.json();
          const token = data && data.csrfToken;
          if (!token) throw new Error('No CSRF token');
          const form = document.getElementById('fallback');
          form.querySelector('input[name="csrfToken"]').value = token;
          form.submit();
        } catch (e) {
          // If anything fails, show a manual continue button
          const btn = document.getElementById('manual');
          if (btn) btn.style.display = 'inline-block';
        }
      })();
    </script>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
  
  // Check for OAuthCallback error in various NextAuth routes:
  // - /api/auth/signin?error=OAuthCallback (NextAuth sign-in page with error)
  // - /api/auth/error (NextAuth error page)
  // - /api/auth/callback/keycloak (OAuth callback with error)
  const isSignInWithError = pathname.includes("/api/auth/signin") && error === "OAuthCallback";
  const isErrorPage = pathname.includes("/api/auth/error");
  const isCallbackWithError = pathname.includes("/api/auth/callback/keycloak") && error === "OAuthCallback";

  // If OAuthCallback error detected, check for existing token and auto-redirect
  // This prevents the error page from being shown to the user
  if ((isSignInWithError || isErrorPage || isCallbackWithError) && error === "OAuthCallback") {
    // Avoid infinite retry loops by only retrying once
    const retry = url.searchParams.get("retry");
    if (retry === "1") {
      // We've already retried once; let NextAuth handle the error normally
      return handler(req as any, context);
    }

    try {
      // Check if there's an existing token in the session cookie
      // Convert NextRequest to a format getToken can use
      const token = await getToken({
        req: req as any, // Type assertion needed for NextAuth compatibility
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: isSecureRequest(req),
      });

      const publicOrigin = getPublicOrigin(req, url);

      // If token exists (even if expired), automatically redirect to Keycloak sign-in
      // This prevents showing the error page to the user
      if (token && token.accessToken) {

        // Get the callback URL from the request or use default
        const callbackUrl =
          url.searchParams.get("callbackUrl") || "/launchdesk";

        // Build the Keycloak sign-in URL
        const signInUrl = `${publicOrigin}/api/auth/signin/keycloak?callbackUrl=${encodeURIComponent(
          callbackUrl
        )}&retry=1`;

        // Automatically redirect to Keycloak sign-in (happens in background, user never sees error page)
        return NextResponse.redirect(signInUrl);
      } else {
        const callbackUrl = url.searchParams.get("callbackUrl") || "/launchdesk";
        const signInUrl = `${publicOrigin}/api/auth/signin/keycloak?callbackUrl=${encodeURIComponent(
          callbackUrl
        )}&retry=1`;
        
        // Always redirect to Keycloak to avoid showing error page
        return NextResponse.redirect(signInUrl);
      }
    } catch (error) {
      // If error occurs, proceed with normal handler
    }
  }

  // For all other requests, use the normal NextAuth handler
  return handler(req as any, context);
}

export const GET = wrappedHandler;
export const POST = wrappedHandler;
