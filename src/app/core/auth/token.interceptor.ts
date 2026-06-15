import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError, switchMap, throwError, BehaviorSubject, filter, take,
} from 'rxjs';
import { AuthService } from './auth.service';
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }
      if (isRefreshing) {
        return refreshDone$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(newToken => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retryReq);
          }),
        );
      }
      isRefreshing = true;
      refreshDone$.next(null); // reset

      return auth.refreshToken().pipe(
        switchMap(res => {
          isRefreshing = false;
          refreshDone$.next(res.accessToken);

          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${res.accessToken}` },
          });
          return next(retryReq);
        }),
        catchError(refreshError => {
          isRefreshing = false;
          refreshDone$.next(null);
          auth.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
