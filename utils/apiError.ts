/**
 * Extract a human-readable message from an API error.
 *
 * Handles:
 *  - Plain string body
 *  - { message: string }
 *  - .NET `ValidationProblemDetails` shape: { errors: { field: string[] } }
 *  - { title, detail } (RFC 7807)
 *  - Network / unknown errors via `Error.message`
 */
export function parseApiError(error: any, fallback: string): string {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim().length > 0) {
    return data;
  }

  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }

    if (data.errors && typeof data.errors === "object") {
      const lines: string[] = [];
      for (const value of Object.values(data.errors)) {
        if (Array.isArray(value)) {
          for (const m of value) {
            if (typeof m === "string" && m.trim().length > 0) lines.push(m);
          }
        } else if (typeof value === "string" && value.trim().length > 0) {
          lines.push(value);
        }
      }
      if (lines.length > 0) return lines.join("\n");
    }

    if (typeof data.detail === "string" && data.detail.trim().length > 0) {
      return data.detail;
    }
    if (typeof data.title === "string" && data.title.trim().length > 0) {
      return data.title;
    }
  }

  if (typeof error?.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
