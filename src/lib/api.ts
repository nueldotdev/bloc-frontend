import { supabase } from "./supabase"

const BASE_URL = import.meta.env.VITE_API_URL

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
  }

  const res = await fetch(`${BASE_URL}/${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers
    }
  })

  if (!res.ok) throw new Error(`Request failed: ${res.status}`)

  return res.json()
}

const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: object) => request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  put: <T>(path: string, body: object) => request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
}

export default api