import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  throwError,
  from
} from 'rxjs';
import {
  catchError,
  finalize,
  switchMap,
  filter,
  take
} from 'rxjs/operators';

import { AuthService } from 'src/services/auth.service';
import { SessionService } from 'src/services/session.service';
import { LoadingService } from 'src/services/loading.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    private loadingService: LoadingService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const skipLoading = req.url.includes('/auth/refresh-token');

    if (!skipLoading) {
      this.loadingService.show();
    }

    return from(this.authService.getTokenAsync()).pipe(
      switchMap(token => {
        let authReq = req;

        if (token) {
          authReq = this.addToken(req, token);
        }

        return next.handle(authReq).pipe(
          catchError(error => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              return this.handle401Error(req, next);
            }

            return throwError(() => error);
          }),
          finalize(() => {
            if (!skipLoading) {
              this.loadingService.hide();
            }
          })
        );
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return from(this.authService.refreshToken()).pipe(
        switchMap((response: any) => {
          const newToken = response?.data?.token;

          if (!newToken) {
            throw new Error('Token inválido no refresh');
          }

          // salva novo token
          this.sessionService.setToken(newToken);
          this.authService.setToken(newToken);

          this.refreshTokenSubject.next(newToken);
          this.isRefreshing = false;

          return next.handle(this.addToken(req, newToken));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.loadingService.reset();
          this.authService.logout();
          return throwError(() => err);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(token => next.handle(this.addToken(req, token!)))
    );
  }
}