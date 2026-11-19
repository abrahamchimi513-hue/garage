import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../components/icon.component';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="state not-found">
      <app-icon name="compass" [size]="40" />
      <h1>404</h1>
      <p>Cette page n'existe pas ou a été déplacée.</p>
      <a class="btn primary" routerLink="/tableau-de-bord"><app-icon name="dashboard" /> Retour au tableau de bord</a>
    </div>
  `,
})
export class NotFoundPage {}
