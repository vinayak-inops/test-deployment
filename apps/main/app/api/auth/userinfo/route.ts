import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        
        // Get the authorization header from the request
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Authorization header is required' },
                { status: 401 }
            );
        }

        // Validate environment variable
        const apiBaseUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL_KEYCLOCK}`;
        if (!apiBaseUrl) {
            return NextResponse.json(
                { 
                    error: 'Server configuration error', 
                    details: 'Keycloak API base URL is not configured. Please check environment variables.',
                    status: 500
                },
                { status: 500 }
            );
        }
        
        
        const keycloakUrl = `${apiBaseUrl}/realms/inops/protocol/openid-connect/userinfo`;
        

        // Forward the request to Keycloak
        const response = await fetch(keycloakUrl, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
        });


        if (!response.ok) {
            const errorText = await response.text();
            
            // Return the actual error from Keycloak
            return NextResponse.json(
                { 
                    error: `Keycloak error: ${response.status}`, 
                    details: errorText,
                    status: response.status
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        // Return the user info
        return NextResponse.json(data);

    } catch (error) {
        return NextResponse.json(
            { 
                error: 'Internal server error', 
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, { status: 200 });
}
