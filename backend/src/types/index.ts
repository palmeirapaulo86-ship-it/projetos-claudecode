export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  error: { code: string; message: string; details?: Record<string, string[]> } | null
  meta: { timestamp: string; version: string }
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: { timestamp: new Date().toISOString(), version: '1.0' },
  }
}

export function errorResponse(code: string, message: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: { code, message },
    meta: { timestamp: new Date().toISOString(), version: '1.0' },
  }
}
