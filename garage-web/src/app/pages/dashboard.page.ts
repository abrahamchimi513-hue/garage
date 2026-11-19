import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BadgeComponent } from '../components/badge.component';
import { BarItem, BarListComponent } from '../components/bar-list.component';
import { IconComponent, IconName } from '../components/icon.component';
import { SpinnerComponent } from '../components/spinner.component';
import { libelle } from '../models/enums';
import { Piece } from '../models/piece';
import { InterventionStats, PieceStats, VehiculeStats } from '../models/stats';
import { InterventionService } from '../services/intervention.service';
import { PieceService } from '../services/piece.service';
import { VehiculeService } from '../services/vehicule.service';
import { FcfaPipe, pct } from '../utils/format';
import { parseApiError } from '../utils/server-errors';

interface DashboardData {
  vehicules: VehiculeStats;
  pieces: PieceStats;
  interventions: InterventionStats;
  alertes: Piece[];
}

interface StatCard {
  icon: IconName;
  label: string;
  value: string;
  tone?: 'warn' | 'accent';
}

/**
 * Tous les agrégats viennent du serveur. Le front ne fait que mettre en forme
 * (formats, largeur des barres), jamais de somme ni de moyenne.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, BadgeComponent, BarListComponent, IconComponent, SpinnerComponent, FcfaPipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Tableau de bord</h1>
        <p class="muted">Vue d'ensemble de l'atelier, du stock et de l'activité.</p>
      </div>
      <button type="button" class="btn" [disabled]="loading()" (click)="load()">
        <app-icon name="refresh" /> Actualiser
      </button>
    </header>

    @if (loading() && !data()) {
      <app-spinner label="Calcul des statistiques…" />
    } @else {
      @if (error()) {
        <div class="state is-error">
          <app-icon name="alert" [size]="24" />
          <p>{{ error() }}</p>
          <button type="button" class="btn" (click)="load()"><app-icon name="refresh" /> Réessayer</button>
        </div>
      } @else {
        @if (data(); as d) {
          @if (loading()) {
            <app-spinner [inline]="true" [size]="16" label="Actualisation…" />
          }

          <section class="section">
            <h2 class="section-title">Atelier</h2>
            <div class="cards">
              @for (c of vehiculeCards(); track c.label) {
                <div class="stat" [attr.data-tone]="c.tone">
                  <span class="stat-icon"><app-icon [name]="c.icon" [size]="20" /></span>
                  <div>
                    <div class="stat-value">{{ c.value }}</div>
                    <div class="stat-label">{{ c.label }}</div>
                  </div>
                </div>
              }
            </div>
            <div class="grid-3">
              <div class="panel">
                <h3>Véhicules par statut</h3>
                <app-bar-list [items]="statutBars()" />
              </div>
              <div class="panel">
                <h3>Véhicules par carburant</h3>
                <app-bar-list [items]="carburantBars()" />
              </div>
              <div class="panel">
                <h3>Top 5 des marques</h3>
                <app-bar-list [items]="marqueBars()" />
              </div>
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">Stock de pièces</h2>
            <div class="cards">
              @for (c of pieceCards(); track c.label) {
                <div class="stat" [attr.data-tone]="c.tone">
                  <span class="stat-icon"><app-icon [name]="c.icon" [size]="20" /></span>
                  <div>
                    <div class="stat-value">{{ c.value }}</div>
                    <div class="stat-label">{{ c.label }}</div>
                  </div>
                </div>
              }
            </div>
            <div class="grid-2">
              <div class="panel">
                <h3>Pièces par catégorie (nombre)</h3>
                <app-bar-list [items]="categorieNombreBars()" />
              </div>
              <div class="panel">
                <h3>Pièces par catégorie (valeur)</h3>
                <app-bar-list [items]="categorieValeurBars()" />
              </div>
            </div>
            <div class="panel">
              <div class="panel-head">
                <h3><app-icon name="alert" [size]="18" /> Pièces en alerte</h3>
                @if (d.pieces.pieceLaPlusChere; as pc) {
                  <span class="muted small">Pièce la plus chère : {{ pc.designation }} · {{ pc.prixUnitaire | fcfa }}</span>
                }
              </div>
              @if (d.alertes.length === 0) {
                <p class="muted small">Aucune pièce sous son seuil d'alerte.</p>
              } @else {
                <ul class="alert-list">
                  @for (p of d.alertes; track p.id) {
                    <li>
                      <div>
                        <strong>{{ p.designation }}</strong>
                        <div class="muted small"><code>{{ p.reference }}</code> · <app-badge [value]="p.categorie" /></div>
                      </div>
                      <div class="alert-qty">
                        <span class="stock low">{{ p.quantiteStock }} / {{ p.seuilAlerte }}</span>
                        <a class="btn small" [routerLink]="['/pieces', p.id, 'modifier']">
                          <app-icon name="pencil" [size]="16" /> Modifier
                        </a>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">Activité et clients</h2>
            <div class="cards">
              @for (c of activiteCards(); track c.label) {
                <div class="stat" [attr.data-tone]="c.tone">
                  <span class="stat-icon"><app-icon [name]="c.icon" [size]="20" /></span>
                  <div>
                    <div class="stat-value">{{ c.value }}</div>
                    <div class="stat-label">{{ c.label }}</div>
                  </div>
                </div>
              }
            </div>
            <div class="grid-2">
              <div class="panel">
                <h3>Top 5 des clients (montant dépensé)</h3>
                <app-bar-list [items]="clientBars()" />
              </div>
              <div class="panel">
                <h3>Top 5 des pièces les plus utilisées</h3>
                <app-bar-list [items]="pieceUsageBars()" />
              </div>
            </div>
          </section>
        }
      }
    }
  `,
})
export class DashboardPage {
  private readonly vehiculeSvc = inject(VehiculeService);
  private readonly pieceSvc = inject(PieceService);
  private readonly interventionSvc = inject(InterventionService);

  protected readonly data = signal<DashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private static readonly nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  private static fmt(n: number | null | undefined): string {
    return DashboardPage.nf.format(typeof n === 'number' && Number.isFinite(n) ? n : 0);
  }
  private static fcfa(n: number | null | undefined): string {
    return `${DashboardPage.fmt(n)} FCFA`;
  }

  protected readonly vehiculeCards = computed<StatCard[]>(() => {
    const v = this.data()?.vehicules;
    if (!v) {
      return [];
    }
    return [
      { icon: 'car', label: 'Véhicules au total', value: DashboardPage.fmt(v.total) },
      { icon: 'wrench', label: 'En réparation', value: DashboardPage.fmt(v.parStatut['EN_REPARATION']), tone: 'accent' },
      { icon: 'chart', label: 'Kilométrage moyen', value: `${DashboardPage.fmt(v.kilometrageMoyen)} km` },
      { icon: 'wallet', label: 'Coût estimé en cours', value: DashboardPage.fcfa(v.coutEstimeEnReparation) },
      { icon: 'arrowDown', label: 'Entrés ce mois-ci', value: DashboardPage.fmt(v.entresCeMois) },
    ];
  });

  protected readonly pieceCards = computed<StatCard[]>(() => {
    const p = this.data()?.pieces;
    if (!p) {
      return [];
    }
    return [
      { icon: 'package', label: 'Références', value: DashboardPage.fmt(p.nombreReferences) },
      { icon: 'clipboard', label: 'Quantité totale', value: DashboardPage.fmt(p.quantiteTotale) },
      { icon: 'wallet', label: 'Valeur du stock', value: DashboardPage.fcfa(p.valeurStock) },
      { icon: 'alert', label: 'Pièces en alerte', value: DashboardPage.fmt(p.enAlerte), tone: p.enAlerte > 0 ? 'warn' : undefined },
    ];
  });

  protected readonly activiteCards = computed<StatCard[]>(() => {
    const i = this.data()?.interventions;
    if (!i) {
      return [];
    }
    return [
      { icon: 'users', label: 'Clients', value: DashboardPage.fmt(i.nombreClients) },
      { icon: 'clipboard', label: 'Interventions', value: DashboardPage.fmt(i.nombreInterventions) },
      { icon: 'wallet', label: "Chiffre d'affaires du mois", value: DashboardPage.fcfa(i.chiffreAffairesMois), tone: 'accent' },
      { icon: 'chart', label: "Coût moyen d'une intervention", value: DashboardPage.fcfa(i.coutMoyen) },
      { icon: 'car', label: 'Véhicules sans intervention', value: DashboardPage.fmt(i.vehiculesSansIntervention) },
    ];
  });

  protected readonly statutBars = computed<BarItem[]>(() => {
    const v = this.data()?.vehicules;
    return v
      ? Object.entries(v.parStatut).map(([k, n]) => ({ label: libelle(k), text: DashboardPage.fmt(n), percent: pct(n, v.total) }))
      : [];
  });

  protected readonly carburantBars = computed<BarItem[]>(() => {
    const v = this.data()?.vehicules;
    return v
      ? Object.entries(v.parCarburant).map(([k, n]) => ({ label: libelle(k), text: DashboardPage.fmt(n), percent: pct(n, v.total) }))
      : [];
  });

  protected readonly marqueBars = computed<BarItem[]>(() => {
    const v = this.data()?.vehicules;
    return v
      ? v.topMarques.map((m) => ({ label: m.libelle, text: DashboardPage.fmt(m.nombre), percent: pct(m.nombre, v.total) }))
      : [];
  });

  protected readonly categorieNombreBars = computed<BarItem[]>(() => {
    const p = this.data()?.pieces;
    return p
      ? p.parCategorie.map((c) => ({ label: libelle(c.categorie), text: DashboardPage.fmt(c.nombre), percent: pct(c.nombre, p.nombreReferences) }))
      : [];
  });

  protected readonly categorieValeurBars = computed<BarItem[]>(() => {
    const p = this.data()?.pieces;
    return p
      ? p.parCategorie.map((c) => ({ label: libelle(c.categorie), text: DashboardPage.fcfa(c.valeur), percent: pct(c.valeur, p.valeurStock) }))
      : [];
  });

  /** Les tops sont triés par le serveur : la première ligne sert de référence de largeur. */
  protected readonly clientBars = computed<BarItem[]>(() => {
    const list = this.data()?.interventions.topClients ?? [];
    const ref = list[0]?.montant ?? 0;
    return list.map((c) => ({ label: c.nom, text: DashboardPage.fcfa(c.montant), percent: pct(c.montant, ref) }));
  });

  protected readonly pieceUsageBars = computed<BarItem[]>(() => {
    const list = this.data()?.interventions.topPieces ?? [];
    const ref = list[0]?.quantiteUtilisee ?? 0;
    return list.map((p) => ({ label: p.designation, text: `${DashboardPage.fmt(p.quantiteUtilisee)} utilisée${p.quantiteUtilisee > 1 ? 's' : ''}`, percent: pct(p.quantiteUtilisee, ref) }));
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      vehicules: this.vehiculeSvc.statistiques(),
      pieces: this.pieceSvc.statistiques(),
      interventions: this.interventionSvc.statistiques(),
      alertes: this.pieceSvc.alertes(),
    }).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(parseApiError(err).message);
        this.loading.set(false);
      },
    });
  }
}
