import { HttpErrorResponse } from '@angular/common/http';

export const errorMessage = (e: unknown): string => {
  const error = e as HttpErrorResponse;
  if (error?.status === 0) return 'Cannot reach the server. Check your connection and try again.';
  return error?.error?.error ?? 'Something went wrong. Try again.';
};
