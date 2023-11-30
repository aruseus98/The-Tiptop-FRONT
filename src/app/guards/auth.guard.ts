// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { Observable, map, take, catchError, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class authGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.isLoggedIn().pipe(
      switchMap((loggedIn: boolean) => {
        take(1) // Prend la valeur actuelle et complète l'Observable
        if (!loggedIn) {
          this.router.navigate(['auth/login']);
          return [false]; // retourner un tableau ici pour que cela corresponde à la signature Observable<boolean>
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
            this.router.navigate(['auth/login']);
            return [false];
          })
        );
      })
    );
  }
}
