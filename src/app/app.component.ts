import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutsComponent } from './layouts/layouts.component';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LayoutsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'the-tiptop-front';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.checkCookiePresence().subscribe(cookiePresent => {
      if (cookiePresent) {
        // Si le cookie est présent et valide, vérifiez l'état d'authentification
        this.authService.checkAuthenticationStatus();
        this.authService.isLoggedIn().subscribe(isLoggedIn => {
          console.log('Utilisateur est connecté:', isLoggedIn);
        });
      } else {
        // Si le cookie n'est pas présent ou invalide, réglez l'état d'authentification sur false
        console.log('Aucun utilisateur connecté');
      }
    });
  }
}
