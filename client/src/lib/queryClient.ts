import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // الحصول على معرف المستخدم من localStorage
  const currentUser = localStorage.getItem("currentUser");
  const userId = currentUser ? JSON.parse(currentUser).id : null;
  
  console.log('API Request Debug:', {
    method,
    url,
    userId: userId ? userId.substring(0, 10) + '...' : 'none',
    currentUser: currentUser ? 'exists' : 'missing'
  });
  
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // إضافة معرف المستخدم في header بعدة طرق للتأكد من المصادقة
  if (userId) {
    headers["Authorization"] = `Bearer ${userId}`;
    headers["x-user-id"] = userId; // إضافة كـ header إضافي
  } else {
    console.warn('No userId available for API request');
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log('Response status:', res.status);
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // الحصول على معرف المستخدم من localStorage
    const currentUser = localStorage.getItem("currentUser");
    const userId = currentUser ? JSON.parse(currentUser).id : null;
    
    const headers: Record<string, string> = {};
    
    // إضافة معرف المستخدم في header بعدة طرق للتأكد من المصادقة
    if (userId) {
      headers["Authorization"] = `Bearer ${userId}`;
      headers["x-user-id"] = userId; // إضافة كـ header إضافي
    }

    const res = await fetch(queryKey[0] as string, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
