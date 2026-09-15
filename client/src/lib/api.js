import axios from 'axios'

/**
 * Single axios instance for the whole app.
 *
 * baseURL is '/' on purpose: in dev the Vite proxy (see vite.config.js) forwards
 * to Flask on :5000, and in production Flask serves this bundle from the same
 * origin. Nothing should ever hardcode a host again.
 */
export const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  // Model calls block the Flask handler; gunicorn allows up to 180s.
  timeout: 125000,
})

/** Error carrying the Flask envelope from app.py:67-88 ({status, message, code}). */
export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new ApiError('The server took too long to respond. Please try again.', {
          code: 'TIMEOUT',
        }),
      )
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError('Cannot reach the server. Check that the API is running.', {
          code: 'NETWORK',
        }),
      )
    }

    const { status, data } = error.response

    // 503 from /predict means MLService has no model loaded — worth its own message.
    if (status === 503) {
      return Promise.reject(
        new ApiError(
          data?.message || 'The prediction model is not loaded on the server.',
          { status, code: 'MODEL_NOT_READY', details: data },
        ),
      )
    }

    // 422 is Pydantic validation. Surface the field detail if present.
    if (status === 422) {
      return Promise.reject(
        new ApiError(data?.message || 'The server rejected these values.', {
          status,
          code: 'VALIDATION',
          details: data?.errors || data?.detail || data,
        }),
      )
    }

    return Promise.reject(
      new ApiError(data?.message || error.message || 'Request failed.', {
        status,
        code: data?.code,
        details: data,
      }),
    )
  },
)

/** Unwraps `response.data` so callers deal in payloads, not axios envelopes. */
export async function post(url, body) {
  const { data } = await api.post(url, body)
  return data
}

export async function get(url, config) {
  const { data } = await api.get(url, config)
  return data
}
