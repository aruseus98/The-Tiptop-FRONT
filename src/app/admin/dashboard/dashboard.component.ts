import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  title= 'Dashboard | Thé Tiptop | Jeu concours';
  isSidebarActive = false;

  constructor(private auth: AuthService, private titleService : Title, private metaService: Meta, private router: Router) {
    this.titleService.setTitle(this.title);
    this.addTag();
  }

  // Définition des différentes balises pour le SEO
  addTag() {
    this.metaService.addTag({ httpEquiv: 'Content-Type', content: 'text/html' }); // Indique aux agents et serveurs de prendre le contenu de cette page en tant que HTML
    this.metaService.addTag({ property: 'og-type', content: "Site web"}); /* Indique le type de l'objet */
    this.metaService.addTag({ name: 'robots', content: 'noindex, nofollow' }); // Permet au robot d'indexer la page
  }

  toggleSidebar() {
    this.isSidebarActive = !this.isSidebarActive;
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        // Gestion de la déconnexion réussie
        console.log('Déconnexion réussie');
        // Redirection vers la page de connexion ou la page d'accueil
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        // Gestion des erreurs
        console.error('Erreur lors de la déconnexion:', error);
        // Afficher un message d'erreur à l'utilisateur si nécessaire
      }
    });
  }
  

}
