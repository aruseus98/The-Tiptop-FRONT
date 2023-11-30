import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { AuthResponse } from 'src/app/models/auth-response';
import { jwtDecode } from "jwt-decode";
import { CookieService, SameSite } from 'ngx-cookie-service'; // Importez CookieService
import { environment } from 'src/environments/environment';
import { tap } from 'rxjs';

interface JwtPayload { // Utilisation d'une interface Payload pour indiquer les informations qui seront stockés
  id?: string;
  email?: string;
  role?: string;
  iat?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private apiUrl = environment.endpointUrl;
  // On ajout les options cookies pour sécuriser notre utilisation des cookies
  private cookieOptions = {
    expires: 1, // Fais que le cookie expire au bout de 1 jour
    secure: true, // Assurez-vous que le cookie est envoyé uniquement sur HTTPS
    httpOnly: true, // Rend le cookie inaccessible au JavaScript côté client
    sameSite: 'Strict' as const  // Limite l'envoi du cookie aux requêtes same-site
  };

  constructor(private router: Router, private http: HttpClient, private cookieService: CookieService, private route: ActivatedRoute) {
    // Vérifiez si un token est déjà présent lors de l'initialisation du service
    // const token = this.getToken();
    //console.log('Token actuel dans le constructeur:', token);
    // const isAuthenticatedValue = token !== null;
    //console.log('Valeur de isAuthenticated.next:', isAuthenticatedValue);
    // this.isAuthenticated.next(isAuthenticatedValue);

    this.checkAuthenticationStatus();
  }

  checkAuthenticationStatus() {
    this.http.post<{ isAuthenticated: boolean }>(`${this.apiUrl}/user/check-auth`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          // Si la réponse est positive, l'utilisateur est authentifié
          console.log('Réponse de check-auth:', response.isAuthenticated);
          this.isAuthenticated.next(response.isAuthenticated);
        },
        error: (error) => {
          // Vérifiez le type d'erreur
          // Si c'est une erreur d'authentification, vous pouvez choisir de ne pas la logger
          if (error.status === 401) { // 401 signifie "Non autorisé"
            // Il est normal que l'utilisateur non authentifié reçoive cette erreur
            this.isAuthenticated.next(false);
          } else {
            // Pour les autres types d'erreurs, vous pouvez choisir de les logger
            console.error('Erreur inattendue lors de la vérification du statut d\'authentification:', error);
          }
        }
      });
  }

  setToken(token: string) {
    this.cookieService.set('token', token, this.cookieOptions); // enregistrez le jeton dans cookieService
    this.isAuthenticated.next(true); // Émet un signal que l'utilisateur est maintenant authentifié
  }

  setUser() {
    this.isAuthenticated.next(true); // Émet un signal que l'utilisateur est maintenant authentifié
  }

  getToken(): string | null {
    const token = this.cookieService.get('token');
    return token ? token : null; // Renvoie null si le token est une chaîne vide ou undefined
  }

  handleAuthentication(): void {
    this.route.queryParams.subscribe(params => {
      const jwt = params['jwt'];
      if (jwt) {
        // Stockez le JWT de manière appropriée
        
        const tokenDecoded = jwtDecode<JwtPayload>(jwt);
          const roleUser = tokenDecoded.role as string;
          const roleId = tokenDecoded.id as string;
          this.setToken(jwt);
          this.setRoleUser(roleUser);
          this.setIdUser(roleId);
        // Redirigez l'utilisateur vers une page protégée ou la page d'accueil
        this.router.navigate(['/concours']);
      }
    });
  }

  // Vérifie si l'user est vérifié ou pas
  getUserById(userId: string): Observable<any> {
    const url = `${this.apiUrl}/user/${userId}`;
    return this.http.get<{ user: { isVerify: boolean }}>(url) // On récupère isVerify qui est un objet d'user dans la réponse API
      .pipe(
        map(response => response.user.isVerify),
        catchError(error => {
          console.error('Une erreur s\'est produite lors de la récupération des données de lutilisateur:', error);
          return throwError(error);
        })
      );
  }

  isLoggedIn() {
    return this.isAuthenticated.asObservable();
  }

  // Appelé lors de la connexion pour stocker le rôle dans depuis les cookies
  setRoleUser(userRole: string) {
    this.cookieService.set('userRole', userRole, this.cookieOptions); // Stocke le rôle dans le cookieService
  }

  // Méthode pour récupérer le rôle de l'utilisateur connecté depuis les cookies
  getRoleUser(): string | null {
    return this.cookieService.get('userRole'); 
  }

  // Appelé lors de la connexion pour stocker l'id du user dans les cookies
  setIdUser(userId: string) {
    this.cookieService.set('userId', userId, this.cookieOptions); 
  }

  // Méthode pour récupérer l'id de l'utilisateur connecté dans les cookies
  getIdUser(): string | null {
    return this.cookieService.get('userId'); 
  }

  // logout() {
  //   this.cookieService.delete('token');
  //   this.isAuthenticated.next(false); // Émet un signal que l'utilisateur n'est plus authentifié
  //   this.router.navigate(['']);
  // }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.isAuthenticated.next(false); // Émet un signal que l'utilisateur n'est plus authentifié
        this.router.navigate(['']); // Redirigez vers la page d'accueil ou la page de connexion
      }),
      catchError(error => {
        console.error('Erreur lors de la déconnexion:', error);
        return throwError(() => new Error('Échec de la déconnexion'));
      })
    );
  }

  login({ email, password }: any): Observable<any> {
    const credentials = { email, password };
  
    return this.http.post<AuthResponse>(this.apiUrl + '/user/login', credentials, { withCredentials: true, observe: 'response' }).pipe(
      switchMap(httpResponse => {
        // Vérifiez si la connexion est réussie en examinant le statut de la réponse HTTP
        if (httpResponse.status === 200) {
          // Effectuez l'appel supplémentaire pour obtenir le rôle et l'ID de l'utilisateur
          this.setUser();
          console.log(this.isAuthenticated)
          return this.getUserInfoFromCookie().pipe(
            tap(userInfo => console.log('User info from cookie:', userInfo)),
            // Mappez la réponse pour retourner true puisque la connexion a réussi
            map(userInfo => {
              // Naviguer en fonction du rôle de l'utilisateur
              switch (userInfo.userRole) {
                case 'admin':
                  this.router.navigate(['/admin/dashboard']);
                  break;
                case 'employee':
                  // ...
                  break;
                case 'customer':
                  this.router.navigate(['/concours']);
                  break;
                default:
                  // ...
                  break;
              }
              return true; // Connexion réussie
            })
          );
        } else {
          // Si la réponse indique une erreur ou un statut inattendu, renvoyez une erreur dans le flux Observable
          const errorResponse = httpResponse.body as AuthResponse; // cast le corps en tant que AuthResponse
          return throwError(() => new Error(errorResponse.message.join('. '))); // Joignez les messages s'il y en a plusieurs
        }
      }),
      catchError((error) => {
        console.error('Error fetching user info from cookie:', error);
        this.isAuthenticated.next(false); // Émet un signal que l'utilisateur n'est plus authentifié
        throw error;
      })
    );
  }
  
  getUserInfoFromCookie(): Observable<{ userRole: string, userId: string }> {
    return this.http.get<{ userRole: string, userId: string }>(`${this.apiUrl}/user/cookie/auth`, { withCredentials: true }) // On ajout withCredentials: true pour indiquer à Angular d'envoyer le cookie qui a été stocké dans la requête
  }

  //Methode pour l'inscription
  signup({ firstname, lastname, phone, email, password, address, birthDate, newsletter , role }: any): Observable<any> {
    // Valeurs en dur pour birthDate, address et role
    // const birthDate = '01/01/2002';
    // const address = '2 Allée Lorentz Champs-sur-Marne';
    // const role ='customer';
    console.log("user try to signup with firstname : ", firstname, " lastname : ", lastname, " phone : ", phone, " email : ", email, " password : ", password, " address : ", address, " birthDate : ", birthDate, "etat newsletter : ", newsletter , " and role : ", role);
    return this.http.post(this.apiUrl + '/user', {
      firstname,
      lastname,
      address,
      birthDate,
      phone,
      email,
      password,
      newsletter,
      role
    }).pipe(
      catchError((error) => {
        if (error.status === 409) {
          // Gérez l'erreur spécifique ici, par exemple en informant l'utilisateur
          alert('Un conflit est survenu : ' + error.error.message);
        }
        // Vous pouvez aussi retransmettre l'erreur si vous voulez la gérer ailleurs
        return throwError(() => new Error('Une erreur est survenue lors de l\'inscription : ' + error.message));
      })
    );
  }

  redirectToGoogleAuth(): void {
    window.location.href = this.apiUrl + '/user/auth/google';
  }


  
}
