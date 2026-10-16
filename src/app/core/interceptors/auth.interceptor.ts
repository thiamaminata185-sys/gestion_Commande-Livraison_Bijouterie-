import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Ajoute le token Bearer à chaque requête vers l'API et renvoie vers /login si le token est refusé. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const estApi = req.url.startsWith(environment.apiUrl);
  const token = auth.token;

  const requete = estApi
    ? req.clone({
        setHeaders: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
    : req;

  return next(requete).pipe(
    catchError((err: HttpErrorResponse) => {
      const pageLogin = req.url.endsWith('/login') || req.url.endsWith('/register');
      if (estApi && err.status === 401 && !pageLogin) {
        auth.vider();
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
