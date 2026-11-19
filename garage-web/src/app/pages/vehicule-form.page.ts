import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { IconComponent } from '../components/icon.component';
import { SpinnerComponent } from '../components/spinner.component';
import { Client } from '../models/client';
import { CARBURANTS, Carburant, Statut, TRANSITIONS } from '../models/enums';
import { VehiculeRequest } from '../models/vehicule';
import { ClientService } from '../services/client.service';
import { NotificationService } from '../services/notification.service';
import { VehiculeService } from '../services/vehicule.service';
import { FormSupport } from '../utils/form-support';
import { LibellePipe } from '../utils/format';
import { routeId } from '../utils/route-id';
import { parseApiError } from '../utils/server-errors';
import { notFutureDate, patternWithMessage, todayIso } from '../utils/validators';

@Component({
  selector: 'app-vehicule-form-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, SpinnerComponent, LibellePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>{{ id === null ? 'Nouveau véhicule' : 'Modifier le véhicule' }}</h1>
        <p class="muted">Les champs marqués d'un astérisque sont obligatoires.</p>
      </div>
      <a class="btn" routerLink="/vehicules"><app-icon name="arrowLeft" /> Retour à la liste</a>
    </header>

    @if (loading()) {
      <app-spinner label="Chargement du formulaire…" />
    } @else {
      @if (loadError()) {
        <div class="state is-error">
          <app-icon name="alert" [size]="24" />
          <p>{{ loadError() }}</p>
          <a class="btn" routerLink="/vehicules">Retour à la liste</a>
        </div>
      } @else {
        <form class="form panel" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (fs.banner(); as b) {
            <div class="banner is-error" role="alert"><app-icon name="alert" [size]="18" /> <span>{{ b }}</span></div>
          }
          <div class="form-grid">
            <div class="field span-2">
              <label for="clientId">Propriétaire *</label>
              <select id="clientId" formControlName="clientId" [class.bad]="!!fs.fieldError('clientId')">
                <option [ngValue]="null">Choisir un client</option>
                @for (c of clients(); track c.id) {
                  <option [ngValue]="c.id">{{ c.nom }} {{ c.prenom }} · {{ c.telephone }}</option>
                }
              </select>
              <span class="er">{{ fs.fieldError('clientId') }}</span>
            </div>

            <div class="field">
              <label for="immatriculation">Immatriculation *</label>
              <input
                id="immatriculation"
                formControlName="immatriculation"
                placeholder="AB-123-CD"
                autocapitalize="characters"
                [class.bad]="!!fs.fieldError('immatriculation')"
              />
              <span class="er">{{ fs.fieldError('immatriculation') }}</span>
            </div>
            <div class="field">
              <label for="carburant">Carburant *</label>
              <select id="carburant" formControlName="carburant" [class.bad]="!!fs.fieldError('carburant')">
                @for (c of carburants; track c) {
                  <option [ngValue]="c">{{ c | libelle }}</option>
                }
              </select>
              <span class="er">{{ fs.fieldError('carburant') }}</span>
            </div>

            <div class="field">
              <label for="marque">Marque *</label>
              <input id="marque" formControlName="marque" [class.bad]="!!fs.fieldError('marque')" />
              <span class="er">{{ fs.fieldError('marque') }}</span>
            </div>
            <div class="field">
              <label for="modele">Modèle *</label>
              <input id="modele" formControlName="modele" [class.bad]="!!fs.fieldError('modele')" />
              <span class="er">{{ fs.fieldError('modele') }}</span>
            </div>

            <div class="field">
              <label for="annee">Année *</label>
              <input id="annee" type="number" inputmode="numeric" formControlName="annee" [class.bad]="!!fs.fieldError('annee')" />
              <span class="er">{{ fs.fieldError('annee') }}</span>
            </div>
            <div class="field">
              <label for="kilometrage">Kilométrage *</label>
              <input id="kilometrage" type="number" inputmode="numeric" formControlName="kilometrage" [class.bad]="!!fs.fieldError('kilometrage')" />
              <span class="er">{{ fs.fieldError('kilometrage') }}</span>
            </div>

            <div class="field">
              <label for="statut">Statut *</label>
              <select id="statut" formControlName="statut" [class.bad]="!!fs.fieldError('statut')">
                @for (s of statutOptions(); track s) {
                  <option [ngValue]="s">{{ s | libelle }}</option>
                }
              </select>
              <span class="er">{{ fs.fieldError('statut') }}</span>
            </div>
            <div class="field">
              <label for="dateEntree">Date d'entrée *</label>
              <input id="dateEntree" type="date" formControlName="dateEntree" [max]="today" [class.bad]="!!fs.fieldError('dateEntree')" />
              <span class="er">{{ fs.fieldError('dateEntree') }}</span>
            </div>

            <div class="field span-2">
              <label for="coutEstime">Coût estimé (FCFA) *</label>
              <input id="coutEstime" type="number" inputmode="decimal" formControlName="coutEstime" [class.bad]="!!fs.fieldError('coutEstime')" />
              <span class="er">{{ fs.fieldError('coutEstime') }}</span>
            </div>

            <div class="field span-2">
              <label for="panne">Panne signalée</label>
              <textarea id="panne" rows="3" formControlName="panne" [class.bad]="!!fs.fieldError('panne')"></textarea>
              <span class="er">{{ fs.fieldError('panne') }}</span>
            </div>
          </div>

          <div class="form-actions">
            <a class="btn" routerLink="/vehicules">Annuler</a>
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
    }
  `,
})
export class VehiculeFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly svc = inject(VehiculeService);
  private readonly clientSvc = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificationService);

  protected readonly id = routeId(this.route);
  protected readonly today = todayIso();
  protected readonly carburants = CARBURANTS;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly clients = signal<Client[]>([]);

  /** Statut courant du véhicule modifié ; null en création. */
  private readonly currentStatut = signal<Statut | null>(null);

  /** Création : EN_ATTENTE seulement. Modification : statut actuel + transitions permises. */
  protected readonly statutOptions = computed<Statut[]>(() => {
    const s = this.currentStatut();
    return s === null ? ['EN_ATTENTE'] : [s, ...TRANSITIONS[s]];
  });

  protected readonly form = this.fb.group({
    clientId: this.fb.control<number | null>(null, [Validators.required]),
    immatriculation: [
      '',
      [Validators.required, patternWithMessage(/^[A-Z]{2}-\d{3}-[A-Z]{2}$/, 'Format attendu : AB-123-CD (lettres majuscules).')],
    ],
    marque: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    modele: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    annee: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(new Date().getFullYear())]],
    kilometrage: [0, [Validators.required, Validators.min(0)]],
    carburant: this.fb.control<Carburant>('ESSENCE', [Validators.required]),
    statut: this.fb.control<Statut>('EN_ATTENTE', [Validators.required]),
    dateEntree: [todayIso(), [Validators.required, notFutureDate]],
    coutEstime: [0, [Validators.required, Validators.min(0)]],
    panne: ['', [Validators.maxLength(500)]],
  });

  protected readonly fs = new FormSupport(this.form, 'immatriculation');

  constructor() {
    const clients$ = this.clientSvc.all();
    if (this.id === null) {
      clients$.subscribe({
        next: (list) => {
          this.clients.set(list);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loadError.set(parseApiError(err).message);
          this.loading.set(false);
        },
      });
    } else {
      forkJoin({ clients: clients$, vehicule: this.svc.get(this.id) }).subscribe({
        next: ({ clients, vehicule: v }) => {
          this.clients.set(clients);
          this.currentStatut.set(v.statut);
          this.form.patchValue({
            clientId: v.clientId,
            immatriculation: v.immatriculation,
            marque: v.marque,
            modele: v.modele,
            annee: v.annee,
            kilometrage: v.kilometrage,
            carburant: v.carburant,
            statut: v.statut,
            dateEntree: v.dateEntree,
            coutEstime: v.coutEstime,
            panne: v.panne ?? '',
          });
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
    if (v.clientId === null) {
      return;
    }
    const body: VehiculeRequest = {
      clientId: v.clientId,
      immatriculation: v.immatriculation.trim(),
      marque: v.marque.trim(),
      modele: v.modele.trim(),
      annee: v.annee,
      kilometrage: v.kilometrage,
      carburant: v.carburant,
      statut: v.statut,
      dateEntree: v.dateEntree,
      coutEstime: v.coutEstime,
      panne: v.panne.trim() === '' ? null : v.panne.trim(),
    };
    this.fs.begin();
    const call$ = this.id === null ? this.svc.create(body) : this.svc.update(this.id, body);
    call$.subscribe({
      next: () => {
        this.notif.success(this.id === null ? 'Véhicule créé.' : 'Véhicule modifié.');
        this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (err: unknown) => this.fs.fail(err),
    });
  }
}
