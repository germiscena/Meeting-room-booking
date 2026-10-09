import {
  ApiError,
  ConflictError,
  ValidationError,
  NotFoundError,
  type ApiErrorResponse,
} from './errors';

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = (data as ApiErrorResponse) || { message: response.statusText };
    const message = errorData.message || 'Произошла непредвиденная ошибка';
    const code = errorData.code;
    const field = errorData.field;

    if (response.status === 409) {
      throw new ConflictError(message);
    }
    if (response.status === 400) {
      throw new ValidationError(message, field);
    }
    if (response.status === 404) {
      throw new NotFoundError(message);
    }

    throw new ApiError(response.status, message, code, field);
  }

  return data as T;
}

export const apiClient = {
  async get<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(url: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...init?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(url: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...init?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T = void>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
    });
    return handleResponse<T>(response);
  },
};
