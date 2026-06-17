import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { options } from '../[...nextauth]/options';

const KEYCLOAK_SESSION_DEBUG_PREFIX = '[keycloak-session]';

function getValueType(value: unknown): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function summarizeObjectShape(value: unknown): Record<string, string> | string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return getValueType(value);
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, fieldValue]) => [
      key,
      getValueType(fieldValue),
    ])
  );
}

// Helper function to decode and validate Keycloak JWT token
function decodeKeycloakToken(token: string): { payload: any; isValid: boolean } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { payload: null, isValid: false };
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Basic validation
    if (!payload.sub || !payload.iss || !payload.exp) {
      return { payload: null, isValid: false };
    }
    
    // Check expiry
    if (payload.exp * 1000 < Date.now()) {
      return { payload: null, isValid: false };
    }
    
    return { payload, isValid: true };
  } catch (error) {
    return { payload: null, isValid: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken } = body;
    
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }
    
    // Decode and validate Keycloak token
    const { payload, isValid } = decodeKeycloakToken(accessToken);
    
    if (!isValid || !payload) {
      return NextResponse.json(
        { error: 'Invalid or expired Keycloak token' },
        { status: 401 }
      );
    }
    
    // Fetch user info from Keycloak to get full profile
    const keycloakBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL_KEYCLOCK;
    let userInfo: any = null;
    
    if (keycloakBaseUrl) {
      try {
        const userInfoUrl = `${keycloakBaseUrl}/realms/inops/protocol/openid-connect/userinfo`;
        const userInfoResponse = await fetch(userInfoUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (userInfoResponse.ok) {
          userInfo = await userInfoResponse.json();
          console.log(`${KEYCLOAK_SESSION_DEBUG_PREFIX} userinfo`, {
            dataType: getValueType(userInfo),
            keys: userInfo && typeof userInfo === 'object' ? Object.keys(userInfo) : [],
            shape: summarizeObjectShape(userInfo),
            sampleValues: {
              sub: userInfo?.sub,
              email: userInfo?.email,
              preferred_username: userInfo?.preferred_username,
              name: userInfo?.name,
              groupsType: getValueType(userInfo?.groups),
              rolesType: getValueType(userInfo?.roles),
              realmAccessType: getValueType(userInfo?.realm_access),
              resourceAccessType: getValueType(userInfo?.resource_access),
            },
          });
        }
      } catch (error) {
      }
    }

    
    // Create NextAuth JWT token structure matching the JWT callback
    const nextAuthToken: any = {
      sub: payload.sub,
      name: userInfo?.name || payload.name || payload.preferred_username,
      email: userInfo?.email || payload.email,
      picture: userInfo?.picture || payload.picture,
      preferred_username: userInfo?.preferred_username || payload.preferred_username,
      accessToken: accessToken,
      idToken: accessToken, // Use access token as id token if not available separately
      expires_at: payload.exp,
      groups: userInfo?.groups || payload.groups || [],
      roles: userInfo?.roles || payload.realm_access?.roles || [],
      realm_access: userInfo?.realm_access || payload.realm_access || {},
      resource_access: userInfo?.resource_access || payload.resource_access || {},
      org: userInfo?.org || payload.org,
      employeeId: userInfo?.employeeId || payload.employeeId,
    };
    
    // Process through NextAuth JWT callback to ensure consistency
    let processedToken = nextAuthToken;
    if (options.callbacks?.jwt) {
      try {
        // Create user object from token/profile data
        const user = {
          id: payload.sub,
          name: userInfo?.name || payload.name || payload.preferred_username,
          email: userInfo?.email || payload.email,
          image: userInfo?.picture || payload.picture,
        };
        
        processedToken = await options.callbacks.jwt({
          token: nextAuthToken,
          user: user,
          account: {
            provider: 'keycloak',
            type: 'oauth',
            access_token: accessToken,
            id_token: accessToken,
            expires_at: payload.exp,
          } as any,
          profile: userInfo || payload,
        }) as any;
      } catch (error) {
        processedToken = nextAuthToken;
      }
    }
    
    // Encode the token using NextAuth's encode function
    const encodedToken = await encode({
      token: processedToken,
      secret: process.env.NEXTAUTH_SECRET || '',
    });
    
    // Create response
    const response = NextResponse.json({ success: true });
    
    // Set NextAuth session cookie
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';
    
    // Calculate cookie expiry from token expiry
    const expiresAt = payload.exp * 1000;
    const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    
    response.cookies.set(cookieName, encodedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    });
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

