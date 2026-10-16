import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models';
import { AuthService } from '../services/auth.service';

/** Réservé aux utilisateurs connectés. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login'], { queryParams: { retour: state.url } });
};

/** Pages de connexion / inscription : renvoie vers l'accueil si déjà connecté. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.parseUrl(auth.homeRoute()) : true;
};

/** Réservé à certains rôles. */
export const roleGuard = (...roles: Role[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const role = auth.role();
  return role && roles.includes(role) ? true : router.parseUrl(auth.isLoggedIn() ? auth.homeRoute() : '/login');
};

/** Route vide "/" : redirige vers la page d'accueil du rôle. */
export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return router.parseUrl(auth.isLoggedIn() ? auth.homeRoute() : '/login');
};
