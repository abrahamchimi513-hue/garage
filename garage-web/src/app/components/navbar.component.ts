import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { PingService } from '../services/ping.service';
import { IconComponent, IconName } from './icon.component';
import { SpinnerComponent } from './spinner.component';

interface NavLink {
  path: string;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, IconComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="navbar">
      <div class="navbar-inner">
        <a class="brand" routerLink="/" aria-label="Garage Atlas Auto, accueil">
          <span class="brand-mark"><app-icon name="wrench" [size]="20" /></span>
          <span class="brand-text">Atlas Auto</span>
        </a>

        <nav class="links" [class.open]="open()" aria-label="Navigation principale">
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active" (click)="open.set(false)">
              <app-icon [name]="l.icon" [size]="18" />
              <span>{{ l.label }}</span>
            </a>
          }
        </nav>

        <div class="navbar-end">
          <span class="api-status" [attr.data-state]="state()" [attr.title]="detail()">
            @if (state() === 'loading') {
              <app-spinner [size]="12" [inline]="true" />
            } @else {
              <span class="dot"></span>
            }
            <span class="api-label">{{ label() }}</span>
          </span>
          <button
            type="button"
            class="btn icon-only menu-toggle"
            [attr.aria-expanded]="open()"
            aria-label="Ouvrir le menu"
            (click)="open.set(!open())"
          >
            <app-icon [name]="open() ? 'x' : 'menu'" />
          </button>
        </div>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  private readonly ping = inject(PingService);
  private readonly router = inject(Router);

  protected readonly links: NavLink[] = [
    { path: '/tableau-de-bord', label: 'Tableau de bord', icon: 'dashboard' },
    { path: '/vehicules', label: 'Véhicules', icon: 'car' },
    { path: '/clients', label: 'Clients', icon: 'users' },
    { path: '/pieces', label: 'Pièces', icon: 'package' },
  ];

  protected readonly open = signal(false);
  protected readonly state = signal<'loading' | 'ok' | 'down'>('loading');
  protected readonly label = signal('Connexion…');
  protected readonly detail = signal('');

  constructor() {
    this.ping.ping().subscribe({
      next: (res) => {
        const msg = res['message'];
        this.state.set('ok');
        this.label.set('API en ligne');
        this.detail.set(typeof msg === 'string' ? msg : 'API disponible');
      },
      error: () => {
        this.state.set('down');
        this.label.set('API hors ligne');
        this.detail.set('Impossible de joindre le serveur');
      },
    });
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.open.set(false));
  }
}
