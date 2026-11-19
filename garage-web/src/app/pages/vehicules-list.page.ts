import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { BadgeComponent } from '../components/badge.component';
import { IconComponent } from '../components/icon.component';
import { PaginationComponent } from '../components/pagination.component';
import { SpinnerComponent } from '../components/spinner.component';
import { Client } from '../models/client';
import { STATUTS, Statut, TRANSITIONS, libelle } from '../models/enums';
import { Page } from '../models/page';
import { Vehicule } from '../models/vehicule';
import { ClientService } from '../services/client.service';
import { NotificationService } from '../services/notification.service';
import { VehiculeService } from '../services/vehicule.service';
import { FcfaPipe, LibellePipe } from '../utils/format';
import { parseApiError } from '../utils/server-errors';

@Component({
  selector: 'app-vehicules-list-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    BadgeComponent,
    IconComponent,
    PaginationComponent,
    SpinnerComponent,
    FcfaPipe,
    LibellePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Véhicules</h1>
        <p class="muted">Suivi des véhicules présents dans l'atelier.</p>
      </div>
      <a class="btn primary" routerLink="/vehicules/nouveau">
        <app-icon name="plus" /> Nouveau véhicule
      </a>
    </header>

    <div class="filters">
      <div class="search-field">
        <app-icon name="search" [size]="18" />
        <input
          type="search"
          [formControl]="search"
          placeholder="Marque, modèle ou immatriculation"
          aria-label="Rechercher un véhicule"
        />
      </div>
      <select #st aria-label="Filtrer par statut" (change)="onStatut(st.value)">
        <option value="" [selected]="statut() === ''">Tous les statuts</option>
        @for (s of statuts; track s) {
          <option [value]="s" [selected]="statut() === s">{{ s | libelle }}</option>
        }
      </select>
      <select #cl aria-label="Filtrer par client" (change)="onClient(cl.value)">
        <option value="" [selected]="clientId() === ''">Tous les clients</option>
        @for (c of clients(); track c.id) {
          <option [value]="c.id" [selected]="clientId() === c.id">{{ c.nom }} {{ c.prenom }}</option>
        }
      </select>
    </div>

    @if (loading()) {
      <app-spinner label="Chargement des véhicules…" />
    } @else {
      @if (error()) {
        <div class="state is-error">
          <app-icon name="alert" [size]="24" />
          <p>{{ error() }}</p>
          <button type="button" class="btn" (click)="reload()"><app-icon name="refresh" /> Réessayer</button>
        </div>
      } @else {
        @if (page(); as p) {
          @if (p.contenu.length === 0) {
            <div class="state">
              <app-icon name="inbox" [size]="28" />
              <p>Aucun véhicule trouvé.</p>
            </div>
          } @else {
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th>Véhicule</th>
                    <th>Immatriculation</th>
                    <th>Propriétaire</th>
                    <th>Statut</th>
                    <th>Entrée</th>
                    <th class="num">Coût estimé</th>
                    <th class="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (v of p.contenu; track v.id) {
                    <tr>
                      <td data-label="Véhicule">
                        <a class="link strong" [routerLink]="['/vehicules', v.id]">{{ v.marque }} {{ v.modele }}</a>
                        <div class="muted small">{{ v.annee }} · {{ v.carburant | libelle }}</div>
                      </td>
                      <td data-label="Immatriculation"><code>{{ v.immatriculation }}</code></td>
                      <td data-label="Propriétaire">{{ v.clientNom }}</td>
                      <td data-label="Statut"><app-badge [value]="v.statut" /></td>
                      <td data-label="Entrée">{{ v.dateEntree | date: 'dd/MM/yyyy' }}</td>
                      <td data-label="Coût estimé" class="num">{{ v.coutEstime | fcfa }}</td>
                      <td class="col-actions">
                        <div class="row-actions">
                          @for (next of transitions(v.statut); track next) {
                            <button type="button" class="btn small accent" (click)="changeStatut(v, next)">
                              <app-icon name="arrowRight" [size]="16" /> {{ next | libelle }}
                            </button>
                          }
                          <a class="btn small" [routerLink]="['/vehicules', v.id]">
                            <app-icon name="eye" [size]="16" /> Fiche
                          </a>
                          <a class="btn small" [routerLink]="['/vehicules', v.id, 'modifier']">
                            <app-icon name="pencil" [size]="16" /> Modifier
                          </a>
                          <button type="button" class="btn small danger" (click)="remove(v)">
                            <app-icon name="trash" [size]="16" /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-pagination
              [page]="p.page"
              [totalPages]="p.totalPages"
              [total]="p.totalElements"
              (pageChange)="goTo($event)"
            />
          }
        }
      }
    }
  `,
})
export class VehiculesListPage {
  private readonly svc = inject(VehiculeService);
  private readonly clientSvc = inject(ClientService);
  private readonly notif = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  protected readonly statuts = STATUTS;
  protected readonly page = signal<Page<Vehicule> | null>(null);
  protected readonly clients = signal<Client[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly statut = signal<Statut | ''>('');
  protected readonly clientId = signal<number | ''>('');
  protected readonly search = new FormControl('', { nonNullable: true });

  private readonly size = 10;
  private pageIndex = 0;
  private readonly refresh$ = new Subject<void>();

  constructor() {
    const fromUrl = Number(this.route.snapshot.queryParamMap.get('clientId'));
    if (Number.isInteger(fromUrl) && fromUrl > 0) {
      this.clientId.set(fromUrl);
    }

    this.clientSvc.all().subscribe({
      next: (list) => this.clients.set(list),
      error: () => this.clients.set([]),
    });

    this.refresh$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.svc
            .list({
              page: this.pageIndex,
              taille: this.size,
              recherche: this.search.value.trim(),
              statut: this.statut(),
              clientId: this.clientId(),
            })
            .pipe(
              catchError((err: unknown) => {
                this.error.set(parseApiError(err).message);
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((p) => {
        this.loading.set(false);
        if (p) {
          this.page.set(p);
        }
      });

    this.search.valueChanges
      .pipe(
        map((v) => v.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.refresh$.next();
      });

    this.refresh$.next();
  }

  protected transitions(s: Statut): readonly Statut[] {
    return TRANSITIONS[s];
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected goTo(index: number): void {
    this.pageIndex = index;
    this.refresh$.next();
  }

  /** Changer un filtre ramène toujours à la première page. */
  protected onStatut(value: string): void {
    this.statut.set(STATUTS.find((s) => s === value) ?? '');
    this.pageIndex = 0;
    this.refresh$.next();
  }

  protected onClient(value: string): void {
    const id = Number(value);
    this.clientId.set(value !== '' && Number.isInteger(id) ? id : '');
    this.pageIndex = 0;
    this.refresh$.next();
  }

  protected changeStatut(v: Vehicule, next: Statut): void {
    this.svc
      .changerStatut(v.id, next)
      .pipe(
        catchError((err: unknown) => {
          this.notif.error(parseApiError(err).message);
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.notif.success(`Statut mis à jour : ${libelle(next)}.`);
        this.refresh$.next();
      });
  }

  protected remove(v: Vehicule): void {
    if (!confirm(`Supprimer le véhicule ${v.immatriculation} (${v.marque} ${v.modele}) ?`)) {
      return;
    }
    this.svc
      .delete(v.id)
      .pipe(
        catchError((err: unknown) => {
          this.notif.error(parseApiError(err).message);
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.notif.success('Véhicule supprimé.');
        const current = this.page();
        if (current && current.contenu.length === 1 && this.pageIndex > 0) {
          this.pageIndex -= 1;
        }
        this.refresh$.next();
      });
  }
}
