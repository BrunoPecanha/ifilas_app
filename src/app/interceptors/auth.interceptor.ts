import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, finalize, switchMap, throwError } from 'rxjs';
import { AuthService } from 'src/services/auth.service';
import { SessionService } from 'src/services/session.service';
import { LoadingService } from 'src/services/loading.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

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

    const token = this.authService.getToken();

    const authReq = token
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : req;

    return next.handle(authReq).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.authService.refreshToken().pipe(
            switchMap((newTokenResponse) => {
              const newToken = newTokenResponse?.data?.token;
              if (!newToken) {
                throw new Error('Novo token ausente');
              }

              this.sessionService.setToken(newToken);
              this.authService.setToken(newToken);

              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });

              return next.handle(newReq);
            }),
            catchError((err) => {
              this.loadingService.reset();
              this.authService.logout();
              return throwError(() => err);
            })
          );
        }

        return throwError(() => error);
      }),
      finalize(() => {
        if (!skipLoading) {
          this.loadingService.hide();
        }
      })
    );
  }
}
