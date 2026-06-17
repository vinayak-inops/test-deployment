import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return request.nextUrl.protocol === "https:" || forwardedProto === "https";
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Block direct browser navigation and only allow same-origin XHR/fetch calls.
    const requestedWith = request.headers.get("x-requested-with");
    if (requestedWith !== "XMLHttpRequest" || !isSameOrigin(request)) {
      return NextResponse.json(
        { error: "Not found" },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: isSecureRequest(request),
    });

    if (!token?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        accessToken: token.accessToken,
        idToken: token.idToken ?? null,
        expires_at: token.expires_at ?? null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to resolve token" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
