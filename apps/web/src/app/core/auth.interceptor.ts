import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() only works synchronously in the interceptor body, not inside the callbacks below.
  const auth = inject(AuthService);
  const token = auth.token();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authed).pipe(
    catchError((error: HttpErrorResponse) => {
      // An expired or revoked token on a protected call ends the session. A failed login (401 with
      // no token attached) must not.
      if (error.status === 401 && token) auth.logout();
      return throwError(() => error);
    }),
  );
};
