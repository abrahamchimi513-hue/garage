import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { SpinnerComponent } from '../components/spinner.component';
import { CATEGORIES, CategoriePiece } from '../models/enums';
import { PieceRequest, TypeMouvement } from '../models/piece';
import { NotificationService } from '../services/notification.service';
import { PieceService } from '../services/piece.service';
import { FormSupport, messageFor } from '../utils/form-support';
import { LibellePipe } from '../utils/format';
import { routeId } from '../utils/route-id';
import { parseApiError } from '../utils/server-errors';
import { notFutureDate, patternWithMessage, strictlyPositive, todayIso } from '../utils/validators';

@Component({
  selector: 'app-piece-form-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, SpinnerComponent, LibellePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>{{ id === null ? 'Nouvelle pièce' : 'Modifier la pièce' }}</h1>
        <p class="muted">Les champs marqués d'un astérisque sont obligatoires.</p>
      </div>
      <a class="btn" routerLink="/pieces"><app-icon name="arrowLeft" /> Retour à la liste</a>
    </header>

    @if (loading()) {
      <app-spinner label="Chargement de la pièce…" />
    } @else {
      @if (loadError()) {
        <div class="state is-error">
          <app-icon name="alert" [size]="24" />
          <p>{{ loadError() }}</p>
          <a class="btn" routerLink="/pieces">Retour à la liste</a>
        </div>
      } @else {
        <form class="form panel" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (fs.banner(); as b) {
            <div class="banner is-error" role="alert"><app-icon name="alert" [size]="18" /> <span>{{ b }}</span></div>
          }
          <div class="form-grid">
            <div class="field">
              <label for="reference">Référence *</label>
              <input id="reference" formControlName="reference" placeholder="PCE-0001" [class.bad]="!!fs.fieldError('reference')" />
              <span class="er">{{ fs.fieldError('reference') }}</span>
            </div>
            <div class="field">
              <label for="categorie">Catégorie *</label>
              <select id="categorie" formControlName="categorie" [class.bad]="!!fs.fieldError('categorie')">
                @for (c of categories; track c) {
                  <option [ngValue]="c">{{ c | libelle }}</option>
                }
              </select>
              <span class="er">{{ fs.fieldError('categorie') }}</span>
            </div>
            <div class="field span-2">
              <label for="designation">Désignation *</label>
              <input id="designation" formControlName="designation" [class.bad]="!!fs.fieldError('designation')" />
              <span class="er">{{ fs.fieldError('designation') }}</span>
            </div>
            <div class="field">
              <label for="fabricant">Fabricant *</label>
              <input id="fabricant" formControlName="fabricant" [class.bad]="!!fs.fieldError('fabricant')" />
              <span class="er">{{ fs.fieldError('fabricant') }}</span>
            </div>
            <div class="field">
              <label for="prixUnitaire">Prix unitaire (FCFA) *</label>
              <input id="prixUnitaire" type="number" inputmode="decimal" formControlName="prixUnitaire" [class.bad]="!!fs.fieldError('prixUnitaire')" />
              <span class="er">{{ fs.fieldError('prixUnitaire') }}</span>
            </div>
            <div class="field">
              <label for="quantiteStock">Quantité en stock *</label>
              <input id="quantiteStock" type="number" inputmode="numeric" formControlName="quantiteStock" [class.bad]="!!fs.fieldError('quantiteStock')" />
              <span class="er">{{ fs.fieldError('quantiteStock') }}</span>
            </div>
            <div class="field">
              <label for="seuilAlerte">Seuil d'alerte *</label>
              <input id="seuilAlerte" type="number" inputmode="numeric" formControlName="seuilAlerte" [class.bad]="!!fs.fieldError('seuilAlerte')" />
              <span class="er">{{ fs.fieldError('seuilAlerte') }}</span>
            </div>
            <div class="field span-2">
              <label for="dateAchat">Date d'achat *</label>
              <input id="dateAchat" type="date" formControlName="dateAchat" [max]="today" [class.bad]="!!fs.fieldError('dateAchat')" />
              <span class="er">{{ fs.fieldError('dateAchat') }}</span>
            </div>
          </div>
          <div class="form-actions">
            <a class="btn" routerLink="/pieces">Annuler</a>
            <button type="submit" class="btn primary" [disabled]="fs.submitting()">
              @if (fs.submitting()) {
                <app-spinner [size]="16" [inline]="true" /> Enregistrement…
              } @else {
                <app-icon name="save" /> Enregistrer
              }
            </button>
          </div>
        </form>

        @if (id !== null) {
          <section class="panel stock-panel">
            <h2>Mouvement de stock</h2>
            <p class="muted">
              Stock actuel : <strong>{{ stockActuel() }}</strong> unité{{ stockActuel() > 1 ? 's' : '' }}
            </p>
            <div class="stock-controls">
              <div class="field">
                <label for="qty">Quantité</label>
                <input id="qty" type="number" inputmode="numeric" min="1" [formControl]="qty" [class.bad]="!!stockError()" />
              </div>
              <button type="button" class="btn accent" [disabled]="moving()" (click)="mouvement('ENTREE')">
                @if (moving() === 'ENTREE') {
                  <app-spinner [size]="16" [inline]="true" />
                } @else {
                  <app-icon name="arrowDown" />
                }
                Entrée
              </button>
              <button type="button" class="btn" [disabled]="moving()" (click)="mouvement('SORTIE')">
                @if (moving() === 'SORTIE') {
                  <app-spinner [size]="16" [inline]="true" />
                } @else {
                  <app-icon name="arrowUp" />
                }
                Sortie
              </button>
            </div>
            <span class="er">{{ stockError() }}</span>
          </section>
        }
      }
    }
  `,
})
export class PieceFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly svc = inject(PieceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificationService);

  protected readonly id = routeId(this.route);
  protected readonly today = todayIso();
  protected readonly categories = CATEGORIES;
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    reference: [
      '',
      [Validators.required, patternWithMessage(/^PCE-\d{4}$/, 'Format attendu : PCE-0001 (PCE, tiret, 4 chiffres).')],
    ],
    designation: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    categorie: this.fb.control<CategoriePiece>('MOTEUR', [Validators.required]),
    fabricant: ['', [Validators.required]],
    prixUnitaire: [0, [Validators.required, strictlyPositive]],
    quantiteStock: [0, [Validators.required, Validators.min(0)]],
    seuilAlerte: [0, [Validators.required, Validators.min(0)]],
    dateAchat: [todayIso(), [Validators.required, notFutureDate]],
  });

  protected readonly fs = new FormSupport(this.form, 'reference');

  // Mouvements de stock (mode modification uniquement)
  protected readonly qty = new FormControl<number | null>(1, [Validators.required, Validators.min(1)]);
  protected readonly stockActuel = signal(0);
  protected readonly stockError = signal<string | null>(null);
  protected readonly moving = signal<TypeMouvement | null>(null);

  constructor() {
    if (this.id !== null) {
      this.loading.set(true);
      this.svc.get(this.id).subscribe({
        next: (p) => {
          this.form.patchValue({
            reference: p.reference,
            designation: p.designation,
            categorie: p.categorie,
            fabricant: p.fabricant,
            prixUnitaire: p.prixUnitaire,
            quantiteStock: p.quantiteStock,
            seuilAlerte: p.seuilAlerte,
            dateAchat: p.dateAchat,
          });
          this.stockActuel.set(p.quantiteStock);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loadError.set(parseApiError(err).message);
          this.loading.set(false);
        },
      });
    }
  }

  protected submit(): void {
    if (!this.fs.validate()) {
      return;
    }
    const v = this.form.getRawValue();
    const body: PieceRequest = {
      reference: v.reference.trim(),
      designation: v.designation.trim(),
      categorie: v.categorie,
      fabricant: v.fabricant.trim(),
      prixUnitaire: v.prixUnitaire,
      quantiteStock: v.quantiteStock,
      seuilAlerte: v.seuilAlerte,
      dateAchat: v.dateAchat,
    };
    this.fs.begin();
    const call$ = this.id === null ? this.svc.create(body) : this.svc.update(this.id, body);
    call$.subscribe({
      next: () => {
        this.notif.success(this.id === null ? 'Pièce créée.' : 'Pièce modifiée.');
        this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (err: unknown) => this.fs.fail(err),
    });
  }

  protected mouvement(type: TypeMouvement): void {
    if (this.id === null) {
      return;
    }
    this.qty.markAsTouched();
    const quantite = this.qty.value;
    if (this.qty.invalid || quantite === null) {
      this.stockError.set(messageFor(this.qty));
      return;
    }
    this.stockError.set(null);
    this.moving.set(type);
    this.svc.mouvementStock(this.id, { type, quantite }).subscribe({
      next: (p) => {
        this.moving.set(null);
        this.stockActuel.set(p.quantiteStock);
        this.form.patchValue({ quantiteStock: p.quantiteStock });
        this.notif.success(type === 'ENTREE' ? `Entrée de ${quantite} enregistrée.` : `Sortie de ${quantite} enregistrée.`);
      },
      error: (err: unknown) => {
        this.moving.set(null);
        this.stockError.set(parseApiError(err).message);
      },
    });
  }
}
