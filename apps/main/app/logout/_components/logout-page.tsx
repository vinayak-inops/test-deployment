"use client"

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2, LogOut, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

export default function LogoutPage() {
    const [logoutStatus, setLogoutStatus] = useState<'confirm' | 'processing' | 'redirecting' | 'error'>('confirm');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

    const performLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            setLogoutStatus('processing');
            
            // Clear all browser storage first
            if (typeof window !== 'undefined') {
                // Clear storages
                try { localStorage.clear(); } catch {}
                try { sessionStorage.clear(); } catch {}

                // Get all existing cookies
                const existingCookies = (document.cookie || '')
                    .split(';')
                    .map((c) => {
                        const [name] = c.split('=');
                        return (name || '').trim();
                    })
                    .filter(Boolean as unknown as (v: string) => v is string);

                // Define known cookie names for this application
                const knownCookies = [
                    // App-specific cookies
                    'roleServices',
                    'userPreferences',
                    'theme',
                    'locale',
                    'keyclockroleinfo',
                    
                    // NextAuth cookies
                    'next-auth.session-token',
                    '__Secure-next-auth.session-token',
                    '__Host-next-auth.session-token',
                    'next-auth.csrf-token',
                    '__Host-next-auth.csrf-token',
                    'next-auth.callback-url',
                    'next-auth.state',
                    
                    // Keycloak/SSO cookies
                    'KEYCLOAK_IDENTITY',
                    'KEYCLOAK_SESSION',
                    'KEYCLOAK_SESSION_LEGACY',
                    'KEYCLOAK_REMEMBER_ME',
                    'KEYCLOAK_LOCALE',
                    'AUTH_SESSION_ID',
                    'AUTH_SESSION_ID_LEGACY',
                    'KC_RESTART',
                    
                    // Common session cookies
                    'JSESSIONID',
                    'sid',
                    'sessionId',
                    'authToken',
                    'accessToken',
                    'refreshToken',
                    
                    // Domain-specific cookies (add your domain)
                    'inops-session',
                    'inops-auth',
                    'inops-user'
                ];

                // Combine all cookie names to remove
                const allCookieNames = Array.from(new Set([...existingCookies, ...knownCookies]));

                // Define paths and domains to cover
                const paths = ['/', '/login', '/dashboard', '/launchdesk', '/master', '/reports', '/workflow', '/leave', '/api'];
                const host = window.location.hostname;
                const baseDomain = host.includes('.') ? host.substring(host.indexOf('.') + 1) : host;
                const domains = ['', host, '.' + host, baseDomain !== host ? '.' + baseDomain : ''].filter(Boolean);

                // Remove cookies with different attributes
                for (const name of allCookieNames) {
                    for (const path of paths) {
                        for (const domain of domains) {
                            const domainPart = domain ? `;domain=${domain}` : '';
                            
                            // Remove with different combinations of attributes
                            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domainPart}`;
                            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domainPart};secure`;
                            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domainPart};samesite=strict`;
                            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domainPart};samesite=lax`;
                            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}${domainPart};samesite=none`;
                            
                            // Also try without domain specification
                            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
                        }
                    }
                }

                // Clear caches
                try {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(k => caches.delete(k)));
                } catch {}

                // Unregister service workers
                if ('serviceWorker' in navigator) {
                    try {
                        const regs = await navigator.serviceWorker.getRegistrations();
                        await Promise.all(regs.map(r => r.unregister()));
                    } catch {}
                }

                // Clear IndexedDB
                if ('indexedDB' in window && (indexedDB as any).databases) {
                    try {
                        const dbs = await (indexedDB as any).databases();
                        await Promise.all((dbs || []).map((db: any) => db?.name ? indexedDB.deleteDatabase(db.name) : undefined));
                    } catch {}
                }

                // Clear other storage mechanisms
                try {
                    // Clear WebSQL (if exists)
                    if ('openDatabase' in window) {
                        // WebSQL databases can't be easily cleared from JS, but we can try
                    }
                    
                    // Clear application cache
                    if ('applicationCache' in window) {
                        (window as any).applicationCache.clear();
                    }
                } catch {}
            }

            // Get ID token from secure token endpoint BEFORE signing out
            try {
                const tokenResponse = await fetch('/api/auth/token', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    }
                });
                
                if (!tokenResponse.ok) {
                    throw new Error(`Token fetch failed: ${tokenResponse.status}`);
                }
                
                const tokenData = await tokenResponse.json();
                
                
                if (tokenData?.idToken) {
                    try {
                        // Use the actual ID token for Keycloak logout
                        const idTokenHint = tokenData.idToken;
                        
                        // Construct Keycloak logout URL with id_token_hint
                        const keycloakBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL_KEYCLOCK;
                        const realm = 'inops';
                        const postLogoutRedirectUri = encodeURIComponent(`${NEXT_PUBLIC_NEXTAUTH_URL}/login`);
                        
                        // Keycloak logout endpoint with required parameters
                        const keycloakLogoutUrl = `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/logout?id_token_hint=${encodeURIComponent(idTokenHint)}&post_logout_redirect_uri=${postLogoutRedirectUri}`;


                        // Sign out from NextAuth first (without redirect)
                        await signOut({ redirect: false });

                        setLogoutStatus('redirecting');
                        
                        // Wait a moment then redirect to Keycloak logout
                        setTimeout(() => {
                            window.location.href = keycloakLogoutUrl;
                        }, 1000);
                        return;
                    } catch (error) {
                    }
                } else {
                }
            } catch (error) {
            }
            
           
            try {
                // Try to get ID token from localStorage if available
                const storedSession = localStorage.getItem('next-auth.session-token') || 
                                     localStorage.getItem('__Secure-next-auth.session-token') ||
                                     localStorage.getItem('__Host-next-auth.session-token');
                
                if (storedSession) {
                    
                    // Try to decode the session token to get user info
                    try {
                        const sessionData = JSON.parse(atob(storedSession.split('.')[1]));
                    } catch (e) {
                    }
                }
                
                // Try to get role cookie for user identification
                const roleCookie = document.cookie
                    .split(';')
                    .find(cookie => cookie.trim().startsWith('keyclockroleinfo='));
                
                if (roleCookie) {
                }
                
            } catch (error) {
            }
            
            // Final fallback: Sign out from NextAuth and redirect to login
            await signOut({ redirect: false });
            
            setLogoutStatus('redirecting');
            
            // Wait a moment then redirect to login
            setTimeout(() => {
                window.location.href = `${NEXT_PUBLIC_NEXTAUTH_URL}/login`;
            }, 1000);
        } catch (error) {
            setLogoutStatus('error');
            
            // Fallback: just redirect to login after error
            setTimeout(() => {
                window.location.href = `${NEXT_PUBLIC_NEXTAUTH_URL}/login`;
            }, 3000);
        }
    };

    const handleConfirmLogout = () => {
        setLogoutStatus('processing');
        performLogout();
    };

    const handleCancel = () => {
        window.location.href = '/launchdesk';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#001233] via-[#002366] to-[#001233] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {logoutStatus === 'confirm' ? (
                    <Card className="border-0 shadow-2xl bg-white">
                        <CardHeader className="space-y-4 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <LogOut className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <CardTitle className="text-lg font-semibold">
                                        Log out from your account?
                                    </CardTitle>
                                    <CardDescription className="text-sm text-gray-500 mt-1">
                                        You'll need to sign in again to continue.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                                    <AlertCircle className="h-3 w-3" />
                                    You won't be able to access:
                                </p>
                                <ul className="space-y-2.5">
                                    <li className="flex items-start gap-2.5 text-sm text-blue-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                        <span className="leading-relaxed">You'll be signed out and won't be able to access this application again until you log back in</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-sm text-blue-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                        <span className="leading-relaxed">All your session data, storage, and authentication cookies will be removed</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-sm text-blue-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                        <span className="leading-relaxed">You'll need to log in again to continue using the application</span>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>

                        <CardFooter className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                className="flex-1 h-9 text-sm border-blue-200 text-gray-700 hover:bg-blue-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmLogout}
                                className="flex-1 h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white border-0"
                            >
                                <LogOut className="mr-2 h-3.5 w-3.5" />
                                Log out
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <Card className="border-0 shadow-2xl bg-white">
                        <CardHeader className="text-center space-y-6 pb-10">
                            <div className="w-20 h-20 mx-auto flex items-center justify-center">
                                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                            </div>
                            <div className="space-y-2">
                                <CardTitle className="text-2xl font-semibold text-gray-900">
                                    Logging out
                                </CardTitle>
                                <CardDescription className="text-sm text-gray-600 flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Clearing session data...</span>
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="pb-8">
                            {logoutStatus === 'error' && (
                                <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-700">
                                        <p className="font-semibold mb-1">Something went wrong</p>
                                        <p className="text-xs">Redirecting to login page...</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
