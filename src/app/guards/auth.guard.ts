// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { Observable, map, take, catchError, switchMap, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class authGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isLoggedIn().pipe(
      switchMap((loggedIn: boolean) => {
        if (!loggedIn) {
          this.router.navigate(['auth/login']);
          return of(false); // Renvoie un nouvel Observable indiquant que l'authentification a échoué
        }
        return this.authService.getUserInfoFromCookie().pipe(
          map(userInfo => {
            if (userInfo.role === 'admin' || userInfo.role === 'employee') {
              return true;
            }
            this.router.navigate(['/']);
            return false;
          }),
          catchError(error => {
            // Si une erreur se produit (par exemple, un token invalide), redirigez l'utilisateur vers la page de connexion
            console.error('Une erreur est survenue lors de la vérification de l\'authentification: ', error);
            this.router.navigate(['auth/login']);
            return of(false); // Renvoie un nouvel Observable indiquant que l'authentification a échoué
          })
        );
      })
    );
  }
}
