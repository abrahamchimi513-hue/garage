import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { BadgeComponent } from '../components/badge.component';
import { IconComponent } from '../components/icon.component';
import { PaginationComponent } from '../components/pagination.component';
import { SpinnerComponent } from '../components/spinner.component';
import { CATEGORIES, CategoriePiece } from '../models/enums';
import { Page } from '../models/page';
import { Piece, enAlerte } from '../models/piece';
import { NotificationService } from '../services/notification.service';
import { PieceService } from '../services/piece.service';
import { FcfaPipe, LibellePipe } from '../utils/format';
import { parseApiError } from '../utils/server-errors';

@Component({
  selector: 'app-pieces-list-page',
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
        <h1>Pièces détachées</h1>
        <p class="muted">Stock du garage. Les lignes signalées sont sous leur seuil d'alerte.</p>
      </div>
      <a class="btn primary" routerLink="/pieces/nouveau">
        <app-icon name="plus" /> Nouvelle pièce
      </a>
    </header>

    <div class="filters">
      <div class="search-field">
        <app-icon name="search" [size]="18" />
        <input
          type="search"
          [formControl]="search"
          placeholder="Référence ou désignation"
          aria-label="Rechercher une pièce"
        />
      </div>
      <select #cat aria-label="Filtrer par catégorie" (change)="onCategorie(cat.value)">
        <option value="" [selected]="categorie() === ''">Toutes les catégories</option>
        @for (c of categories; track c) {
          <option [value]="c" [selected]="categorie() === c">{{ c | libelle }}</option>
        }
      </select>
    </div>

    @if (loading()) {
      <app-spinner label="Chargement des pièces…" />
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
              <p>Aucune pièce trouvée.</p>
            </div>
          } @else {
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th>Pièce</th>
                    <th>Catégorie</th>
                    <th>Fabricant</th>
                    <th class="num">Prix unitaire</th>
                    <th class="num">Stock</th>
                    <th>Achat</th>
                    <th class="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pc of p.contenu; track pc.id) {
                    <tr [class.alert-row]="alerte(pc)">
                      <td data-label="Pièce">
                        <strong>{{ pc.designation }}</strong>
                        <div class="muted small"><code>{{ pc.reference }}</code></div>
                      </td>
                      <td data-label="Catégorie"><app-badge [value]="pc.categorie" /></td>
                      <td data-label="Fabricant">{{ pc.fabricant }}</td>
                      <td data-label="Prix unitaire" class="num">{{ pc.prixUnitaire | fcfa }}</td>
                      <td data-label="Stock" class="num">
                        <span class="stock" [class.low]="alerte(pc)">
                          @if (alerte(pc)) {
                            <app-icon name="alert" [size]="15" />
                          }
                          {{ pc.quantiteStock }}
                        </span>
                        <div class="muted small">seuil : {{ pc.seuilAlerte }}</div>
                      </td>
                      <td data-label="Achat">{{ pc.dateAchat | date: 'dd/MM/yyyy' }}</td>
                      <td class="col-actions">
                        <div class="row-actions">
                          <a class="btn small" [routerLink]="['/pieces', pc.id, 'modifier']">
                            <app-icon name="pencil" [size]="16" /> Modifier
                          </a>
                          <button type="button" class="btn small danger" (click)="remove(pc)">
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
export class PiecesListPage {
  private readonly svc = inject(PieceService);
  private readonly notif = inject(NotificationService);

  protected readonly categories = CATEGORIES;
  protected readonly page = signal<Page<Piece> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categorie = signal<CategoriePiece | ''>('');
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
            .list({
              page: this.pageIndex,
              taille: this.size,
              recherche: this.search.value.trim(),
              categorie: this.categorie(),
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

  protected alerte(p: Piece): boolean {
    return enAlerte(p);
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected goTo(index: number): void {
    this.pageIndex = index;
    this.refresh$.next();
  }

  protected onCategorie(value: string): void {
    this.categorie.set(CATEGORIES.find((c) => c === value) ?? '');
    this.pageIndex = 0;
    this.refresh$.next();
  }

  protected remove(p: Piece): void {
    if (!confirm(`Supprimer la pièce ${p.reference} (${p.designation}) ?`)) {
      return;
    }
    this.svc
      .delete(p.id)
      .pipe(
        catchError((err: unknown) => {
          this.notif.error(parseApiError(err).message);
          return EMPTY;
        }),
      )
      .subscribe(() => {
        this.notif.success('Pièce supprimée.');
        const current = this.page();
        if (current && current.contenu.length === 1 && this.pageIndex > 0) {
          this.pageIndex -= 1;
        }
        this.refresh$.next();
      });
  }
}
