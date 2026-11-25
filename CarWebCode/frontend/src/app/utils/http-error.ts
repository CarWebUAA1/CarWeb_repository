import { HttpErrorResponse } from '@angular/common/http';

/**
 * The message to show for a failed request. The API answers `{ message }` in some
 * routes and `{ error }` in others (errorHandler), so both are read.
 */
export function apiErrorText(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Could not connect to the server.';
    if (error.status === 413) return 'The photos are too large. Each one must be 5 MB or less.';
    const body = error.error as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === 'string') return capitalize(body.message);
    if (typeof body?.error === 'string') return capitalize(body.error);
  }
  return fallback;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** CSS classes of a status pill: "In progress" -> "ws-pill ws-pill--in-progress". */
export function pillClass(status: string): string {
  return `ws-pill ws-pill--${status.toLowerCase().replace(/\s+/g, '-')}`;
}
