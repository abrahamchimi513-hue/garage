import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Intervention, LigneIntervention } from '../models/intervention';
import { Piece } from '../models/piece';
import { InterventionService } from '../services/intervention.service';
import { NotificationService } from '../services/notification.service';
import { FormSupport } from '../utils/form-support';
import { FcfaPipe, LibellePipe } from '../utils/format';
import { parseApiError } from '../utils/server-errors';
import { BadgeComponent } from './badge.component';
import { IconComponent } from './icon.component';
import { SpinnerComponent } from './spinner.component';

/** Une intervention : ses lignes de pièces, son total, l'ajout et le retrait de pièces. */
@Component({
  selector: 'app-intervention-card',
  imports: [DatePipe, ReactiveFormsModule, BadgeComponent, IconComponent, SpinnerComponent, FcfaPipe, LibellePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="panel intervention">
      <header class="intervention-head">
        <div>
          <div class="intervention-title">
            <app-badge [value]="intervention().type" />
            <span class="muted small">
              Du {{ intervention().dateDebut | date: 'dd/MM/yyyy' }}
              @if (intervention().dateFin) {
                au {{ intervention().dateFin | date: 'dd/MM/yyyy' }}
              } @else {
                · en cours
              }
            </span>
          </div>
          <p class="intervention-desc">{{ intervention().description }}</p>
        </div>
        <button type="button" class="btn small danger" [disabled]="deleting()" (click)="removeIntervention()">
          @if (deleting()) {
            <app-spinner [size]="14" [inline]="true" />
          } @else {
            <app-icon name="trash" [size]="16" />
          }
          Supprimer
        </button>
      </header>

      @if (intervention().lignes.length === 0) {
        <p class="muted small">Aucune pièce utilisée pour cette intervention.</p>
      } @else {
        <div class="table-wrap flat">
          <table class="data compact">
            <thead>
              <tr>
                <th>Pièce</th>
                <th class="num">Quantité</th>
                <th class="num">Prix unitaire</th>
                <th class="num">Sous-total</th>
                <th class="col-actions"><span class="sr-only">Retirer</span></th>
              </tr>
            </thead>
            <tbody>
              @for (l of intervention().lignes; track l.id) {
                <tr>
                  <td data-label="Pièce">
                    {{ l.pieceDesignation }}
                    @if (l.pieceReference) {
                      <div class="muted small"><code>{{ l.pieceReference }}</code></div>
                    }
                  </td>
                  <td data-label="Quantité" class="num">{{ l.quantite }}</td>
                  <td data-label="Prix unitaire" class="num">{{ l.prixUnitaire | fcfa }}</td>
                  <td data-label="Sous-total" class="num">{{ l.quantite * l.prixUnitaire | fcfa }}</td>
                  <td class="col-actions">
                    <button
                      type="button"
                      class="btn small icon-only danger"
                      [attr.aria-label]="'Retirer ' + l.pieceDesignation"
                      [disabled]="removingId() === l.id"
                      (click)="removeLigne(l)"
                    >
                      @if (removingId() === l.id) {
                        <app-spinner [size]="14" [inline]="true" />
                      } @else {
                        <app-icon name="x" [size]="16" />
                      }
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <form class="ligne-form" [formGroup]="form" (ngSubmit)="addLigne()" novalidate>
        <div class="field grow">
          <label [attr.for]="'piece-' + intervention().id">Ajouter une pièce</label>
          <select [id]="'piece-' + intervention().id" formControlName="pieceId" [class.bad]="!!fs.fieldError('pieceId')">
            <option [ngValue]="null">Choisir une pièce</option>
            @for (p of availablePieces(); track p.id) {
              <option [ngValue]="p.id" [disabled]="p.quantiteStock === 0">
                {{ p.designation }} ({{ p.reference }}) · stock : {{ p.quantiteStock }}
              </option>
            }
          </select>
          <span class="er">{{ fs.fieldError('pieceId') }}</span>
        </div>
        <div class="field qty">
          <label [attr.for]="'qty-' + intervention().id">Quantité</label>
          <input [id]="'qty-' + intervention().id" type="number" inputmode="numeric" min="1" formControlName="quantite" [class.bad]="!!fs.fieldError('quantite')" />
          <span class="er">{{ fs.fieldError('quantite') }}</span>
        </div>
        <div class="field btn-field">
          <button type="submit" class="btn accent" [disabled]="fs.submitting()">
            @if (fs.submitting()) {
              <app-spinner [size]="16" [inline]="true" /> Ajout…
            } @else {
              <app-icon name="plus" /> Ajouter
            }
          </button>
        </div>
      </form>
      @if (fs.banner(); as b) {
        <div class="banner is-error" role="alert"><app-icon name="alert" [size]="18" /> <span>{{ b }}</span></div>
      }

      <footer class="totals">
        <div><span class="muted">Main-d'œuvre</span> <strong>{{ intervention().mainOeuvre | fcfa }}</strong></div>
        <div class="grand"><span>Total</span> <strong>{{ intervention().total | fcfa }}</strong></div>
      </footer>
    </article>
  `,
})
export class InterventionCardComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly svc = inject(InterventionService);
  private readonly notif = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly intervention = input.required<Intervention>();
  readonly pieces = input<Piece[]>([]);
  /** Émis après toute modification, pour recharger l'historique et les stocks. */
  readonly changed = output<void>();

  protected readonly deleting = signal(false);
  protected readonly removingId = signal<number | null>(null);

  /** Une pièce ne peut figurer qu'une fois par intervention. */
  protected readonly availablePieces = computed(() => {
    const used = new Set(this.intervention().lignes.map((l) => l.pieceId));
    return this.pieces().filter((p) => !used.has(p.id));
  });

  protected readonly form = this.fb.group({
    pieceId: this.fb.control<number | null>(null, [Validators.required]),
    quantite: [1, [Validators.required, Validators.min(1), (c: AbstractControl) => this.stockValidator(c)]],
  });

  protected readonly fs = new FormSupport(this.form);

  constructor() {
    this.form.controls.pieceId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.quantite.updateValueAndValidity());
  }

  private stockValidator(c: AbstractControl): ValidationErrors | null {
    const pieceId: unknown = c.parent?.get('pieceId')?.value;
    const qty: unknown = c.value;
    const piece = this.pieces().find((p) => p.id === pieceId);
    if (piece && typeof qty === 'number' && qty > piece.quantiteStock) {
      return { custom: `Stock insuffisant (disponible : ${piece.quantiteStock}).` };
    }
    return null;
  }

  protected addLigne(): void {
    if (!this.fs.validate()) {
      return;
    }
    const { pieceId, quantite } = this.form.getRawValue();
    if (pieceId === null) {
      return;
    }
    this.fs.begin();
    this.svc.addLigne(this.intervention().id, { pieceId, quantite }).subscribe({
      next: () => {
        this.fs.submitting.set(false);
        this.form.reset({ pieceId: null, quantite: 1 });
        this.notif.success('Pièce ajoutée, stock mis à jour.');
        this.changed.emit();
      },
      error: (err: unknown) => this.fs.fail(err),
    });
  }

  protected removeLigne(l: LigneIntervention): void {
    if (!confirm(`Retirer « ${l.pieceDesignation} » ? Le stock sera restitué.`)) {
      return;
    }
    this.removingId.set(l.id);
    this.svc.removeLigne(this.intervention().id, l.id).subscribe({
      next: () => {
        this.removingId.set(null);
        this.notif.success('Ligne retirée, stock restitué.');
        this.changed.emit();
      },
      error: (err: unknown) => {
        this.removingId.set(null);
        this.notif.error(parseApiError(err).message);
      },
    });
  }

  protected removeIntervention(): void {
    if (!confirm('Supprimer cette intervention ? Le stock des pièces utilisées sera restitué.')) {
      return;
    }
    this.deleting.set(true);
    this.svc.delete(this.intervention().id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.notif.success('Intervention supprimée, stock restitué.');
        this.changed.emit();
      },
      error: (err: unknown) => {
        this.deleting.set(false);
        this.notif.error(parseApiError(err).message);
      },
    });
  }
}
