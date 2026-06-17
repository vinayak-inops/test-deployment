import { NextRequest, NextResponse } from 'next/server';
import useCurrentDomain from "@/hooks/api/useCurrentDomain";


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
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()|| '';

const allowedOrigin = normalizeOrigin(NEXT_PUBLIC_NEXTAUTH_URL);

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
    
    // Extract parameters from request body
    const {
      activeTab,
      isSelfPermission = false,
      isAllPermission = false,
      canApprove = false,
      canReject = false,
      canCancel = false,
      employeeId,
      tenantCode,
      searchField = 'employeeID',
      searchValue = '',
      offset = 0,
      limit = 10,
      operation = 'search', // 'search' or 'count'
      workflowState = null // Optional: for status-specific counts
    } = requestBody;

    // Determine which collection to use based on activeTab and permissions
    let collectionName: string;
    if (activeTab === 'applications' || activeTab === 'pending') {
      collectionName = 'forgotPunchApplication';
    } else if (activeTab === 'cancelled' || activeTab === 'rejected' || activeTab === 'approved') {
      if (isSelfPermission) {
        collectionName = 'forgotPunchApplication';
      } else if (isAllPermission) {
        collectionName = 'forgotPunchApplicationTransaction';
      } else {
        collectionName = 'forgotPunchApplication';
      }
    } else {
      collectionName = 'forgotPunchApplication';
    }

    // Build request data - add filters based on activeTab and permissions
    const trimmedSearch = (searchValue || '').trim();
    const requestData: any[] = [
      {
        field: "tenantCode",
        value: tenantCode,
        operator: "eq",
      },
      {
        field: "createdOn",
        value: "",
        operator: "desc",
      }
    ];
    
    // For applications tab: filter by createdBy with logged-in employee ID
    if (activeTab === 'applications' && employeeId) {
      requestData.push({
        field: "createdBy",
        value: employeeId,
        operator: "eq",
      });
    }
    
    // For pending tab: filter by createdBy if self permission, else by approvedBy
    if (activeTab === 'pending' && employeeId) {
      if (isSelfPermission) {
        requestData.push({
          field: "createdBy",
          value: employeeId,
          operator: "eq",
        });
      } else if (isAllPermission) {
        requestData.push({
          field: "approvedBy",
          value: employeeId,
          operator: "eq",
        });
      }
    }
    
    // For approve tab: filter by createdBy and workflowState if self permission, else by approvedBy if canApprove or canReject
    if (activeTab === 'approved' && employeeId) {
      if (isSelfPermission) {
        requestData.push({
          field: "createdBy",
          value: employeeId,
          operator: "eq",
        });
        requestData.push({
          field: "workflowState",
          value: "APPROVED",
          operator: "eq",
        });
      } else if (canApprove || canReject || canCancel) {
        requestData.push({
          field: "approvedBy",
          value: employeeId,
          operator: "eq",
        });
      }
    }
    
    // For reject tab: filter by createdBy and workflowState if self permission, else by rejectedBy if canReject
    if (activeTab === 'rejected' && employeeId) {
      if (isSelfPermission) {
        requestData.push({
          field: "createdBy",
          value: employeeId,
          operator: "eq",
        });
        requestData.push({
          field: "workflowState",
          value: "REJECTED",
          operator: "eq",
        });
      } else if (canReject || canApprove || canCancel) {
        requestData.push({
          field: "rejectedBy",
          value: employeeId,
          operator: "eq",
        });
      }
    }
    
    // For cancel tab: filter by createdBy and workflowState if self permission, else by cancelledBy if canCancel
    if (activeTab === 'cancelled' && employeeId) {
      if (isSelfPermission) {
        requestData.push({
          field: "createdBy",
          value: employeeId,
          operator: "eq",
        });
        requestData.push({
          field: "workflowState",
          value: "CANCELLED",
          operator: "eq",
        });
      } else if (canCancel || canApprove || canReject) {
        requestData.push({
          field: "cancelledBy",
          value: employeeId,
          operator: "eq",
        });
      }
    }
    
    // Text search filter (like operator)
    if (trimmedSearch) {
      requestData.push({
        field: searchField,
        operator: "like",
        value: trimmedSearch,
      });
    }

    // Add workflowState filter if provided (for status-specific counts)
    if (workflowState) {
      if (Array.isArray(workflowState)) {
        // For "in" operator (e.g., ["CANCELLED", "CANCEL"])
        requestData.push({
          field: "workflowState",
          operator: "in",
          value: workflowState,
        });
      } else {
        // For "eq" operator (e.g., "APPROVED", "REJECTED")
        requestData.push({
          field: "workflowState",
          operator: "eq",
          value: workflowState,
        });
      }
    }

    // Determine the backend URL based on operation
    const backendUrl = operation === 'count' 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/query/attendance/${collectionName}/count`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/query/attendance/${collectionName}/search?offset=${offset}&limit=${limit}`;

    // Call the backend service
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestData),
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

    // Return the backend response
    return NextResponse.json(backendData);

  } catch (error) {
    console.error('Error in punch-applications POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle GET request for testing
export async function GET() {
  return NextResponse.json({
    message: "Punch Applications API",
    timestamp: new Date().toISOString(),
  });
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: corsHeaders()
  });
}

