import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { BadgeComponent } from '../components/badge.component';
import { IconComponent } from '../components/icon.component';
import { InterventionCardComponent } from '../components/intervention-card.component';
import { SpinnerComponent } from '../components/spinner.component';
import { Client } from '../models/client';
import { Statut, TRANSITIONS, TYPES_INTERVENTION, TypeIntervention, libelle } from '../models/enums';
import { Intervention, InterventionRequest } from '../models/intervention';
import { Piece } from '../models/piece';
import { Vehicule } from '../models/vehicule';
import { ClientService } from '../services/client.service';
import { InterventionService } from '../services/intervention.service';
import { NotificationService } from '../services/notification.service';
import { PieceService } from '../services/piece.service';
import { VehiculeService } from '../services/vehicule.service';
import { FormSupport } from '../utils/form-support';
import { FcfaPipe, LibellePipe } from '../utils/format';
import { routeId } from '../utils/route-id';
import { parseApiError } from '../utils/server-errors';
import { notBeforeSibling, notFutureDate, todayIso } from '../utils/validators';

@Component({
  selector: 'app-vehicule-detail-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    BadgeComponent,
    IconComponent,
    InterventionCardComponent,
    SpinnerComponent,
    FcfaPipe,
    LibellePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <app-spinner label="Chargement de la fiche…" />
    } @else {
      @if (error()) {
        <div class="state is-error">
          <app-icon name="alert" [size]="24" />
          <p>{{ error() }}</p>
          <div class="row-actions">
            <a class="btn" routerLink="/vehicules"><app-icon name="arrowLeft" /> Retour</a>
            <button type="button" class="btn" (click)="load()"><app-icon name="refresh" /> Réessayer</button>
          </div>
        </div>
      } @else {
        @if (vehicule(); as v) {
          <header class="page-head">
            <div>
              <h1>{{ v.marque }} {{ v.modele }}</h1>
              <p class="muted"><code>{{ v.immatriculation }}</code></p>
            </div>
            <div class="row-actions">
              <a class="btn" routerLink="/vehicules"><app-icon name="arrowLeft" /> Liste</a>
              <a class="btn primary" [routerLink]="['/vehicules', v.id, 'modifier']">
                <app-icon name="pencil" /> Modifier
              </a>
            </div>
          </header>

          <div class="detail-grid">
            <section class="panel">
              <div class="panel-head">
                <h2><app-icon name="car" [size]="20" /> Véhicule</h2>
                <app-badge [value]="v.statut" />
              </div>
              <dl class="kv">
                <div><dt>Année</dt><dd>{{ v.annee }}</dd></div>
                <div><dt>Carburant</dt><dd>{{ v.carburant | libelle }}</dd></div>
                <div><dt>Kilométrage</dt><dd>{{ v.kilometrage }} km</dd></div>
                <div><dt>Entrée</dt><dd>{{ v.dateEntree | date: 'dd/MM/yyyy' }}</dd></div>
                <div><dt>Coût estimé</dt><dd>{{ v.coutEstime | fcfa }}</dd></div>
                <div class="wide"><dt>Panne signalée</dt><dd>{{ v.panne || '—' }}</dd></div>
              </dl>
              @if (transitions(v.statut).length > 0) {
                <div class="row-actions top-gap">
                  @for (next of transitions(v.statut); track next) {
                    <button type="button" class="btn accent" [disabled]="changingStatut()" (click)="changeStatut(next)">
                      @if (changingStatut()) {
                        <app-spinner [size]="16" [inline]="true" />
                      } @else {
                        <app-icon name="arrowRight" />
                      }
                      Passer à « {{ next | libelle }} »
                    </button>
                  }
                </div>
              }
            </section>

            <section class="panel">
              <div class="panel-head">
                <h2><app-icon name="user" [size]="20" /> Propriétaire</h2>
              </div>
              @if (client(); as c) {
                <dl class="kv">
                  <div class="wide"><dt>Nom</dt><dd>{{ c.nom }} {{ c.prenom }}</dd></div>
                  <div><dt>Téléphone</dt><dd>{{ c.telephone }}</dd></div>
                  <div><dt>Ville</dt><dd>{{ c.ville || '—' }}</dd></div>
                  <div class="wide"><dt>E-mail</dt><dd>{{ c.email || '—' }}</dd></div>
                </dl>
                <div class="row-actions top-gap">
                  <a class="btn small" [routerLink]="['/clients', c.id, 'modifier']">
                    <app-icon name="pencil" [size]="16" /> Modifier le client
                  </a>
                </div>
              } @else {
                <p>{{ v.clientNom }}</p>
              }
            </section>
          </div>

          <section class="section">
            <div class="page-head tight">
              <h2><app-icon name="clipboard" [size]="22" /> Interventions</h2>
              @if (v.statut !== 'LIVRE') {
                <button type="button" class="btn primary" (click)="showForm.set(!showForm())">
                  <app-icon [name]="showForm() ? 'x' : 'plus'" />
                  {{ showForm() ? 'Fermer' : 'Nouvelle intervention' }}
                </button>
              } @else {
                <span class="muted small">Véhicule livré : plus d'intervention possible.</span>
              }
            </div>

            @if (showForm()) {
              <form class="form panel" [formGroup]="form" (ngSubmit)="createIntervention()" novalidate>
                @if (fs.banner(); as b) {
                  <div class="banner is-error" role="alert"><app-icon name="alert" [size]="18" /> <span>{{ b }}</span></div>
                }
                <div class="form-grid">
                  <div class="field">
                    <label for="type">Type *</label>
                    <select id="type" formControlName="type" [class.bad]="!!fs.fieldError('type')">
                      @for (t of types; track t) {
                        <option [ngValue]="t">{{ t | libelle }}</option>
                      }
                    </select>
                    <span class="er">{{ fs.fieldError('type') }}</span>
                  </div>
                  <div class="field">
                    <label for="mainOeuvre">Main-d'œuvre (FCFA) *</label>
                    <input id="mainOeuvre" type="number" inputmode="decimal" formControlName="mainOeuvre" [class.bad]="!!fs.fieldError('mainOeuvre')" />
                    <span class="er">{{ fs.fieldError('mainOeuvre') }}</span>
                  </div>
                  <div class="field">
                    <label for="dateDebut">Date de début *</label>
                    <input id="dateDebut" type="date" formControlName="dateDebut" [max]="today" [class.bad]="!!fs.fieldError('dateDebut')" />
                    <span class="er">{{ fs.fieldError('dateDebut') }}</span>
                  </div>
                  <div class="field">
                    <label for="dateFin">Date de fin</label>
                    <input id="dateFin" type="date" formControlName="dateFin" [class.bad]="!!fs.fieldError('dateFin')" />
                    <span class="er">{{ fs.fieldError('dateFin') }}</span>
                  </div>
                  <div class="field span-2">
                    <label for="description">Description *</label>
                    <textarea id="description" rows="3" formControlName="description" [class.bad]="!!fs.fieldError('description')"></textarea>
                    <span class="er">{{ fs.fieldError('description') }}</span>
                  </div>
                </div>
                <div class="form-actions">
                  <button type="button" class="btn" (click)="showForm.set(false)">Annuler</button>
                  <button type="submit" class="btn primary" [disabled]="fs.submitting()">
                    @if (fs.submitting()) {
                      <app-spinner [size]="16" [inline]="true" /> Enregistrement…
                    } @else {
                      <app-icon name="save" /> Enregistrer
                    }
                  </button>
                </div>
              </form>
            }

            @if (refreshing()) {
              <app-spinner label="Mise à jour…" [size]="24" />
            }

            @for (it of interventions(); track it.id) {
              <app-intervention-card [intervention]="it" [pieces]="pieces()" (changed)="refresh()" />
            } @empty {
              @if (!refreshing()) {
                <div class="state">
                  <app-icon name="inbox" [size]="28" />
                  <p>Aucune intervention enregistrée pour ce véhicule.</p>
                </div>
              }
            }
          </section>
        }
      }
    }
  `,
})
export class VehiculeDetailPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly vehiculeSvc = inject(VehiculeService);
  private readonly clientSvc = inject(ClientService);
  private readonly pieceSvc = inject(PieceService);
  private readonly interventionSvc = inject(InterventionService);
  private readonly notif = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly id = routeId(this.route);
  protected readonly today = todayIso();
  protected readonly types = TYPES_INTERVENTION;

  protected readonly vehicule = signal<Vehicule | null>(null);
  protected readonly client = signal<Client | null>(null);
  protected readonly interventions = signal<Intervention[]>([]);
  protected readonly pieces = signal<Piece[]>([]);
  protected readonly loading = signal(true);
  protected readonly refreshing = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly changingStatut = signal(false);

  protected readonly form = this.fb.group({
    type: this.fb.control<TypeIntervention>('DIAGNOSTIC', [Validators.required]),
    description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    dateDebut: [todayIso(), [Validators.required, notFutureDate]],
    dateFin: ['', [notBeforeSibling('dateDebut', 'La date de fin ne peut pas précéder la date de début.')]],
    mainOeuvre: [0, [Validators.required, Validators.min(0)]],
  });

  protected readonly fs = new FormSupport(this.form);

  constructor() {
    this.form.controls.dateDebut.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.dateFin.updateValueAndValidity());
    this.load();
  }

  protected transitions(s: Statut): readonly Statut[] {
    return TRANSITIONS[s];
  }

  protected load(): void {
    if (this.id === null) {
      this.error.set('Identifiant de véhicule invalide.');
      this.loading.set(false);
      return;
    }
    const id = this.id;
    this.loading.set(true);
    this.error.set(null);
    this.vehiculeSvc
      .get(id)
      .pipe(
        switchMap((v) =>
          forkJoin({
            vehicule: of(v),
            client: this.clientSvc.get(v.clientId).pipe(catchError(() => of(null))),
            interventions: this.interventionSvc.forVehicule(id),
            pieces: this.pieceSvc.all(),
          }),
        ),
      )
      .subscribe({
        next: (r) => {
          this.vehicule.set(r.vehicule);
          this.client.set(r.client);
          this.interventions.set(r.interventions);
          this.pieces.set(r.pieces);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.error.set(parseApiError(err).message);
          this.loading.set(false);
        },
      });
  }

  /** Recharge l'historique et les stocks après une modification. */
  protected refresh(): void {
    if (this.id === null) {
      return;
    }
    this.refreshing.set(true);
    forkJoin({
      interventions: this.interventionSvc.forVehicule(this.id),
      pieces: this.pieceSvc.all(),
    }).subscribe({
      next: (r) => {
        this.interventions.set(r.interventions);
        this.pieces.set(r.pieces);
        this.refreshing.set(false);
      },
      error: (err: unknown) => {
        this.refreshing.set(false);
        this.notif.error(parseApiError(err).message);
      },
    });
  }

  protected changeStatut(next: Statut): void {
    if (this.id === null) {
      return;
    }
    this.changingStatut.set(true);
    this.vehiculeSvc.changerStatut(this.id, next).subscribe({
      next: (v) => {
        this.changingStatut.set(false);
        this.vehicule.set(v);
        this.notif.success(`Statut mis à jour : ${libelle(next)}.`);
      },
      error: (err: unknown) => {
        this.changingStatut.set(false);
        this.notif.error(parseApiError(err).message);
      },
    });
  }

  protected createIntervention(): void {
    if (this.id === null || !this.fs.validate()) {
      return;
    }
    const v = this.form.getRawValue();
    const body: InterventionRequest = {
      vehiculeId: this.id,
      type: v.type,
      description: v.description.trim(),
      dateDebut: v.dateDebut,
      dateFin: v.dateFin === '' ? null : v.dateFin,
      mainOeuvre: v.mainOeuvre,
    };
    this.fs.begin();
    this.interventionSvc.create(body).subscribe({
      next: () => {
        this.fs.submitting.set(false);
        this.notif.success('Intervention créée.');
        this.form.reset({ type: 'DIAGNOSTIC', description: '', dateDebut: todayIso(), dateFin: '', mainOeuvre: 0 });
        this.showForm.set(false);
        this.refresh();
      },
      error: (err: unknown) => this.fs.fail(err),
    });
  }
}
