import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { Profile } from "next-auth";

// Extend the built-in session type
declare module "next-auth" {
  interface Session {
    expires_at?: number;
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      picture?: string | null;
      preferred_username?: string | null;
      groups?: string[];
      roles?: string[];
      realm_access?: any;
      resource_access?: any;
    }
  }
}

// Extend the built-in JWT type
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    expires_at?: number;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    preferred_username?: string | null;
    groups?: string[];
    roles?: string[];
    realm_access?: any;
    resource_access?: any;
  }
}

// Extend the built-in Profile type for Keycloak
declare module "next-auth/providers/keycloak" {
  interface KeycloakProfile extends Profile {
    sub: string;
    email_verified: boolean;
    // Only add new fields if needed, do not redeclare existing ones with different types
  }
}

export const options: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: `${process.env.NEXT_KEYCLOAK_CLIENT_ID}`,
      clientSecret: `${process.env.NEXT_KEYCLOAK_CLIENT_SECRET}`, 
      issuer: `${process.env.NEXT_KEYCLOAK_ISSUER}`,
      // Add scope to request additional user information
      authorization: {
        params: {
          scope: 'openid email profile groups roles'
        }
      },
      profile(profile: Profile) {
        const p = profile as any;
        console.log("Raw Keycloak profile data:", p);
        return {
          id: p.sub,
          name: p.name || p.preferred_username,
          email: p.email,
          image: p.picture,
          preferred_username: p.preferred_username,
          // Capture additional Keycloak fields
          groups: p.groups,
          roles: p.roles,
          realm_access: p.realm_access,
          resource_access: p.resource_access,
        }
      },
    }),
    // GoogleProvider({
    //   clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    //   authorization: {
    //     params: {
    //       prompt: "consent",
    //       access_type: "offline",
    //       response_type: "code"
    //     }
    //   }
    // }),
    // AzureADProvider({
    //   clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '6e08f3f7-fca8-427c-a91a-89b6402beb40',
    //   clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '325dc9b4-817b-44ed-b0ba-f5b275bc93c0',
    //   tenantId: process.env.MICROSOFT_TENANT_ID || '3d9a9b2b-a1e0-4ae4-afb0-9c4a0c6c39c9',
    //   authorization: {
    //     params: {
    //       scope: 'openid profile email',
    //       response_type: 'code',
    //       response_mode: 'query'
    //     }
    //   }
    // }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // This callback is called when a user signs in
      // If we're here, the sign-in is proceeding normally
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        if (account.access_token) {
          // Parse JWT tokens (Keycloak and Microsoft/Azure AD)
          if ((account.provider === 'keycloak' || account.provider === 'azure-ad') && account.access_token.includes('.')) {
            try {
              const payload = JSON.parse(Buffer.from(account.access_token.split('.')[1], 'base64').toString());
              token.expires_at = payload.exp;
            } catch (e) {
              // If parsing fails, set a default expiry (1 hour)
              token.expires_at = account.expires_at || Math.floor(Date.now() / 1000) + 3600;
            }
          } else if (account.provider === 'google') {
            // For Google OAuth, set expiry from account
            token.expires_at = account.expires_at || Math.floor(Date.now() / 1000) + 3600;
          } else {
            // Default fallback
            token.expires_at = account.expires_at || Math.floor(Date.now() / 1000) + 3600;
          }
        }
      }
      if (profile) {
        const p = profile as any;
        // Handle Microsoft profile structure
        if (account?.provider === 'azure-ad') {
          token.name = p.name || `${p.given_name || ''} ${p.family_name || ''}`.trim() || p.preferred_username || p.email;
          token.email = p.email || p.preferred_username;
          token.picture = p.picture || p.image;
          token.preferred_username = p.preferred_username || p.email;
          // For Microsoft/Azure AD, set default empty arrays for compatibility
          token.groups = [];
          token.roles = [];
          token.realm_access = {};
          token.resource_access = {};
        } else {
          token.name = p.name || p.preferred_username || p.given_name || p.family_name;
          token.email = p.email;
          token.picture = p.picture || p.image;
          token.preferred_username = p.preferred_username || p.email;
          
          // Handle Keycloak-specific fields
          if (account?.provider === 'keycloak') {
            token.groups = p.groups;
            token.roles = p.roles;
            token.realm_access = p.realm_access;
            token.resource_access = p.resource_access;
          } else if (account?.provider === 'google') {
            // For Google, set default empty arrays for compatibility
            token.groups = [];
            token.roles = [];
            token.realm_access = {};
            token.resource_access = {};
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - token data:", token);
      session.expires_at = token.expires_at;
      session.user = {
        name: token.name,
        email: token.email,
        image: token.picture,
        preferred_username: token.preferred_username,
        // Include additional Keycloak information
        groups: token.groups,
        roles: token.roles,
        realm_access: token.realm_access,
        resource_access: token.resource_access,
      };
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        ...(process.env.NEXTAUTH_COOKIE_DOMAIN
          ? { domain: process.env.NEXTAUTH_COOKIE_DOMAIN }
          : {}),
      },
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
    },
    async signOut({ session, token }) {
    },
  },
  pages: {
    error: "/auth-error", // Custom error page
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(options);
