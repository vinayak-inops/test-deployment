import { NextRequest, NextResponse } from 'next/server';


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
const allowedOrigin = normalizeOrigin(primaryOrigin);

function corsHeaders() {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Bearer token is required' },
        { status: 401 }
      );
    }

    // Extract the token from the Bearer header
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get the request body
    const requestBody = await request.json();
    
    // Extract serviceName and screenName from request body
    const serviceName = requestBody.serviceName || "master";
    const screenName = requestBody.screenName || "location";


    // Prepare backend request body with the original format
    const backendRequestBody = [
      {
        field: "entitlementCode",
        value: requestBody.entitlementCode || "ECT-CLMS-USER",
        operator: "eq",
      },
      {
        field: "tenantCode",
        value: requestBody.tenantCode || "",
        operator: "eq",
      }
    ];

    // Call the backend service
    const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/query/attendance/role_permissions/search`;

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(backendRequestBody),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { 
          error: 'Backend service error',
          details: errorText,
          status: backendResponse.status
        },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();


    // Use dynamic serviceName from request
    
    // Filter and process the response for the specific service
    let filteredResponse = backendData;
    
    if (Array.isArray(backendData) && backendData.length > 0) {
      const processedData = backendData.map((item: any) => {
        if (item.screenPermissions && Array.isArray(item.screenPermissions)) {
          // Filter for the master service specifically
          const targetService = item.screenPermissions.find((service: any) => 
            service.serviceName === serviceName
          );
          
          if (targetService && targetService.screens) {
            // Filter for dynamic screen only
            const targetScreen = targetService.screens.find((screen: any) => 
              screen.screenName === screenName
            );
            
            if (targetScreen && targetScreen.permissions) {
              // Return only the permissions object with true values
              const truePermissions: any = {};
              Object.keys(targetScreen.permissions).forEach(key => {
                if (targetScreen.permissions[key] === true) {
                  truePermissions[key] = true;
                }
              });
              
              return truePermissions;
            } else {
            }
          }
        }
        return item;
      });
      
      filteredResponse = processedData;
    }

    // Return the filtered response as direct object (not array)
    if (Array.isArray(filteredResponse) && filteredResponse.length > 0) {
      return NextResponse.json(filteredResponse[0]);
    }
    
    return NextResponse.json(filteredResponse);

  } catch (error) {
    console.error('Error in role-permissions POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET request for testing
export async function GET() {
  return NextResponse.json({
    message: "hello master",
    timestamp: new Date().toISOString(),
    hello: true
  });
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: corsHeaders()
  });
}
