import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="brand-mark"><app-icon name="wrench" [size]="18" /></span>
          <div>
            <strong>Atlas Auto</strong>
            <p class="muted small">Gestion du garage : véhicules, clients, pièces et interventions.</p>
          </div>
        </div>

        <nav class="footer-links" aria-label="Liens du pied de page">
          <a routerLink="/tableau-de-bord">Tableau de bord</a>
          <a routerLink="/vehicules">Véhicules</a>
          <a routerLink="/clients">Clients</a>
          <a routerLink="/pieces">Pièces</a>
        </nav>
      </div>

      <div class="footer-bottom">
        <span>© {{ annee }} Garage Atlas Auto. Tous droits réservés.</span>
        <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noopener">Documentation de l'API</a>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly annee = new Date().getFullYear();
}
