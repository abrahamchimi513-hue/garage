import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { IconComponent } from '../components/icon.component';
import { PaginationComponent } from '../components/pagination.component';
import { SpinnerComponent } from '../components/spinner.component';
import { Client } from '../models/client';
import { Page } from '../models/page';
import { ClientService } from '../services/client.service';
import { NotificationService } from '../services/notification.service';
import { parseApiError } from '../utils/server-errors';

@Component({
  selector: 'app-clients-list-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, IconComponent, PaginationComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Clients</h1>
        <p class="muted">Propriétaires des véhicules reçus au garage.</p>
      </div>
      <a class="btn primary" routerLink="/clients/nouveau">
        <app-icon name="plus" /> Nouveau client
      </a>
    </header>

    <div class="filters">
      <div class="search-field">
        <app-icon name="search" [size]="18" />
        <input
          type="search"
          [formControl]="search"
          placeholder="Rechercher par nom, prénom ou téléphone"
          aria-label="Rechercher un client"
        />
      </div>
    </div>

    @if (loading()) {
      <app-spinner label="Chargement des clients…" />
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
              <p>Aucun client trouvé.</p>
            </div>
          } @else {
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Téléphone</th>
                    <th>E-mail</th>
                    <th>Ville</th>
                    <th>Inscription</th>
                    <th class="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of p.contenu; track c.id) {
                    <tr>
                      <td data-label="Client"><strong>{{ c.nom }} {{ c.prenom }}</strong></td>
                      <td data-label="Téléphone">{{ c.telephone }}</td>
                      <td data-label="E-mail">{{ c.email || '—' }}</td>
                      <td data-label="Ville">{{ c.ville || '—' }}</td>
                      <td data-label="Inscription">{{ c.dateInscription | date: 'dd/MM/yyyy' }}</td>
                      <td class="col-actions">
                        <div class="row-actions">
                          <a class="btn small" [routerLink]="['/vehicules']" [queryParams]="{ clientId: c.id }">
                            <app-icon name="car" [size]="16" /> Véhicules
                          </a>
                          <a class="btn small" [routerLink]="['/clients', c.id, 'modifier']">
                            <app-icon name="pencil" [size]="16" /> Modifier
                          </a>
                          <button type="button" class="btn small danger" (click)="remove(c)">
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
export class ClientsListPage {
  private readonly svc = inject(ClientService);
  private readonly notif = inject(NotificationService);

  protected readonly page = signal<Page<Client> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = new FormControl('', { nonNullable: true });

  private readonly size = 10;
  private pageIndex = 0;
  private readonly refresh$ = new Subject<void>();

  constructor() {
    this.refresh$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.svc
            .list({ page: this.pageIndex, taille: this.size, recherche: this.search.value.trim() })
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

    // Pause de 300 ms : une seule requête après une frappe rapide.
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

  protected reload(): void {
    this.refresh$.next();
  }

  protected goTo(index: number): void {
    this.pageIndex = index;
    this.refresh$.next();
  }

  protected remove(c: Client): void {
    if (!confirm(`Supprimer le client « ${c.nom} ${c.prenom} » ?`)) {
      return;
    }
    this.svc
      .delete(c.id)
      .pipe(
        catchError((err: unknown) => {
          this.notif.error(parseApiError(err).message);
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.notif.success('Client supprimé.');
        const current = this.page();
        if (current && current.contenu.length === 1 && this.pageIndex > 0) {
          this.pageIndex -= 1;
        }
        this.refresh$.next();
      });
  }
}
