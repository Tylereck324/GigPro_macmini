// src/lib/api/apiClient.ts
// This is a generic API client that was used by the original API wrappers.
// It assumes a Next.js /api route structure.

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { params, body, ...rest } = options;
  let queryString = '';

  if (params) {
    const usp = new URLSearchParams(params);
    queryString = `?${usp.toString()}`;
  }

  const response = await fetch(`${url}${queryString}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
}
