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
    return this.authService.getUserInfoFromCookie().pipe(
      map(userInfo => {
        if (userInfo.userRole === 'admin' || userInfo.userRole === 'employee') {
          return true; // Autoriser l'accès pour les admin et les employés
        }
        this.router.navigate(['/']); // Rediriger les autres rôles
        return false;
      }),
      catchError(error => {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        this.router.navigate(['auth/login']); // Redirection en cas d'erreur
        return of(false);
      })
    );
  }
}
