import { HttpErrorResponse } from '@angular/common/http';

export const errorMessage = (e: unknown): string =>
  (e as HttpErrorResponse)?.error?.error ?? 'Something went wrong';
