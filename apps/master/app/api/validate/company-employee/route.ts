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
        { status: false, message: 'Bearer token is required' },
        { status: 200 }
      );
    }

    // Extract the token from the Bearer header
    const token = authHeader.substring(7);

    if (!token) {
      return NextResponse.json(
        { status: false, message: 'Invalid token' },
        { status: 200 }
      );
    }

    // Get the request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { status: false, message: 'Invalid JSON in request body' },
        { status: 200 }
      );
    }

    // Call the backend validation service for company employee
    const backendUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/workflow/company-employee/validate`;
    

    try {
      // Check if backend URL is configured
      if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
        console.error('❌ Backend URL not configured');
        return NextResponse.json(
          { status: false, message: 'Internal server error: Backend service not configured' },
          { status: 200 }
        );
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      // Clear timeout if request completes
      clearTimeout(timeoutId);

      // Check if response is OK before parsing
      if (!backendResponse.ok) {
        // Handle 404 (Not Found) - backend endpoint doesn't exist
        if (backendResponse.status === 404) {
          console.error('❌ Backend endpoint not found (404):', backendUrl);
          return NextResponse.json(
            { status: false, message: 'Internal server error: Validation service not available' },
            { status: 200 }
          );
        }

        // Handle other HTTP errors
        let errorMessage = 'Backend validation failed';
        const contentType = backendResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await backendResponse.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            // If backend returns "Not Found", show internal server error
            if (errorMessage.toLowerCase().includes('not found')) {
              errorMessage = 'Internal server error: Validation service not available';
            }
          } catch {
            errorMessage = 'Backend validation failed (invalid JSON response)';
          }
        } else {
          try {
            const errorText = await backendResponse.text();
            errorMessage = errorText || errorMessage;
            // If backend returns "Not Found", show internal server error
            if (errorMessage.toLowerCase().includes('not found')) {
              errorMessage = 'Internal server error: Validation service not available';
            }
          } catch {
            errorMessage = `Backend validation failed (HTTP ${backendResponse.status})`;
            // For 404, show internal server error
            if (backendResponse.status === 404) {
              errorMessage = 'Internal server error: Validation service not available';
            }
          }
        }
        return NextResponse.json(
          { status: false, message: errorMessage },
          { status: 200 }
        );
      }

      const backendData = await backendResponse.json();
      

      // Success: wrap backend response in data field
      return NextResponse.json(
        { status: true, data: backendData },
        { status: 200 }
      );

    } catch (fetchError: any) {
      console.error('❌ Backend validation fetch error:', fetchError);
      console.error('❌ Error name:', fetchError.name);
      console.error('❌ Error message:', fetchError.message);
      
      // Check if it's a timeout or network error
      let errorMessage = 'Internal server error: Unable to connect to validation service';
      
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError' || 
          (fetchError.message && fetchError.message.toLowerCase().includes('aborted'))) {
        errorMessage = 'Internal server error: Validation service timeout. Please try again later.';
        console.error('❌ Backend timeout - service may be unavailable or slow');
      } else if (fetchError.message && fetchError.message.toLowerCase().includes('not found')) {
        errorMessage = 'Internal server error: Validation service not available';
        console.error('❌ Backend endpoint not found');
      } else if (fetchError.message && (
        fetchError.message.toLowerCase().includes('failed to fetch') ||
        fetchError.message.toLowerCase().includes('network error') ||
        fetchError.message.toLowerCase().includes('econnrefused') ||
        fetchError.message.toLowerCase().includes('enotfound')
      )) {
        errorMessage = 'Internal server error: Cannot reach validation service. Please check your connection.';
        console.error('❌ Backend connection failed - service may be down or unreachable');
      } else if (fetchError.message) {
        errorMessage = `Internal server error: ${fetchError.message}`;
      }
      
      return NextResponse.json(
        { 
          status: false, 
          message: errorMessage,
          error: fetchError.message || 'Backend connection error',
          backendUrl: backendUrl
        },
        { status: 200 }
      );
    }

  } catch (error: any) {
    console.error('Error in validate company-employee POST:', error);
    return NextResponse.json(
      { status: false, message: error.message || 'Internal server error' },
      { status: 200 }
    );
  }
}

// Handle GET request for testing/debugging
export async function GET() {
  return NextResponse.json({
    message: "Validation API route is working",
    endpoint: "/api/validate/company-employee",
    timestamp: new Date().toISOString()
  });
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: corsHeaders()
  });
}

