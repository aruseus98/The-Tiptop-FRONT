import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { AuthResponse } from 'src/app/models/auth-response';
import { jwtDecode } from "jwt-decode";

interface JwtPayload { // Utilisation d'une interface Payload pour indiquer les informations qui seront stockés
  email? : string;
  role? : string;
  iat? : number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private apiUrl = 'http://api.dev.dsp-archiwebo22b-ji-rw-ah.fr/user/login';

  constructor(private router: Router, private http: HttpClient) {
    // Vérifiez si un token est déjà présent lors de l'initialisation du service
    this.isAuthenticated.next(this.getToken() !== null);
  }

  setToken(token: string) {
    localStorage.setItem('token', token); // enregistrez le jeton dans localStorage
    this.isAuthenticated.next(true); // Émet un signal que l'utilisateur est maintenant authentifié
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn() {
    return this.isAuthenticated.asObservable();
  }

  // Appelé lors de la connexion pour stocker le rôle
  setRoleUser(userRole: string) {
    localStorage.setItem('userRole', userRole); // Stocke le rôle dans le localStorage
  }

  // Méthode pour récupérer le rôle de l'utilisateur
  getRoleUser(): string | null {
    return localStorage.getItem('userRole'); // Récupère le rôle depuis le localStorage
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.isAuthenticated.next(false); // Émet un signal que l'utilisateur n'est plus authentifié
    this.router.navigate(['home']);
  }

  login({ email, password }: any): Observable<any> {
    const credentials = { email, password };
    console.log("user try to log with user name : ", credentials.email, " and password : ", credentials.password);

    return this.http.post<AuthResponse>(this.apiUrl, credentials).pipe(
      switchMap((response) => {
        if (!response.error) {
          this.setToken(response.jwt);
          const tokenDecoded = jwtDecode<JwtPayload>(response.jwt);
          const roleUser = tokenDecoded.role as string;
          this.setRoleUser(roleUser);
  
          // Au lieu de naviguer ici, retournez un nouvel Observable qui décide où naviguer.
          return of(roleUser); // Ici, 'of' est utilisé pour transformer la valeur en Observable.
        } else {
          return throwError(() => new Error(response.message[0]));
        }
      }),
      map(roleUser => {
        if (roleUser === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          // Gérez les autres cas de rôle ici.
        }
        return roleUser; // Vous pouvez toujours renvoyer le rôle si nécessaire pour la suite du traitement.
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  // Méthode de redirection basée sur le rôle
  private redirectUserBasedOnRole(role: string): void {
    if (role === 'employee') {
      // Redirection pour les employés
      console.log('Redirigé vers employee')
    } else if (role === 'client') {
      // Redirection pour les clients
    } else {
      console.log('Redirigé vers clients')
      // Redirection par défaut
    }
  }

  signup({ firstname, lastname, phone, email, password }: any): Observable<any> {
    console.log("user try to signup with firstname : ", firstname, " lastname : ", lastname, " phone : ", phone, " email : ", email, " and password : ", password);

    return throwError(new Error('Failed to signup'));
  }
}