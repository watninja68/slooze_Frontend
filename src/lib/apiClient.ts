// src/lib/apiClient.ts

const AUTH_TOKEN_STORAGE_KEY = "sllozeAuthToken"; // Same key as in AuthContext

interface ApiErrorData {
  message?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  data?: ApiErrorData;

  constructor(message: string, status: number, data?: ApiErrorData) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export async function fetchApi<T = any>(
  endpoint: string,
  method: string = "GET",
  body: Record<string, any> | null = null,
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      : null;
  const headers = new Headers();

  if (body) {
    headers.append("Content-Type", "application/json");
  }

  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  // Assuming relative paths are handled by Next.js proxy or are relative to the current domain.
  // No need to prepend a base URL for now as per instructions.
  const requestUrl = endpoint;
  console.log(requestUrl);
  try {
    const response = await fetch(requestUrl, config);

    if (!response.ok) {
      let errorData: ApiErrorData | undefined;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore error if response is not JSON
        errorData = { message: response.statusText };
      }
      throw new ApiError(
        errorData?.message ||
          `API request failed with status ${response.status}`,
        response.status,
        errorData,
      );
    }

    if (response.status === 204) {
      // No Content
      return null as T;
    }

    // Check if response has content before trying to parse
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json() as Promise<T>;
    } else {
      // Handle non-JSON responses if necessary, or return as is for certain types
      // For now, returning null if not explicitly JSON and not 204
      // This might need adjustment based on actual API behavior
      return null as T; // Or response.text() if text is expected
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or other unexpected issue
    console.error("API call failed:", error);
    throw new ApiError(
      error instanceof Error
        ? error.message
        : "An unknown network error occurred",
      0, // Using 0 for status when it's a network or unknown error
      { originalError: error },
    );
  }
}
