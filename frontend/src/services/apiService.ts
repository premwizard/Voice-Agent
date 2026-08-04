// ==============================================================================
// FILE: src/services/apiService.ts
// WHAT THIS FILE IS: API Service Module for HTTP requests to FastAPI Backend.
// WHY IT IS USED: Encapsulates all REST fetch calls (such as health check and 
//                 configuration calls) to keep component code clean and maintainable.
// ==============================================================================

// Retrieve the base backend URL from environment variables, defaulting to localhost:8000
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Interface defining the structure of the health check response from FastAPI
export interface HealthStatus {
  status: string;
  environment: string;
  ai_provider: string;
}

/**
 * Fetches server health status from FastAPI endpoint GET /api/v1/health
 */
export async function fetchServerHealth(): Promise<HealthStatus> {
  try {
    // Send asynchronous HTTP GET request to FastAPI backend endpoint
    const response = await fetch(`${BACKEND_URL}/api/v1/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Disable caching to get fresh server status every time
      cache: "no-store",
    });

    // Check if response HTTP status code is OK (200)
    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    // Parse and return JSON response body typed as HealthStatus
    const data: HealthStatus = await response.json();
    return data;
  } catch (error) {
    // Log error to console and rethrow meaningful error message
    console.error("Failed to fetch server health:", error);
    throw error;
  }
}
