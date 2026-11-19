import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { SpinnerComponent } from '../components/spinner.component';
import { ClientRequest } from '../models/client';
import { ClientService } from '../services/client.service';
import { NotificationService } from '../services/notification.service';
import { FormSupport } from '../utils/form-support';
import { routeId } from '../utils/route-id';
import { parseApiError } from '../utils/server-errors';
import { notFutureDate, patternWithMessage, todayIso } from '../utils/validators';

@Component({
  selector: 'app-client-form-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>{{ id === null ? 'Nouveau client' : 'Modifier le client' }}</h1>
        <p class="muted">Les champs marqués d'un astérisque sont obligatoires.</p>
      </div>
      <a class="btn" routerLink="/clients"><app-icon name="arrowLeft" /> Retour à la liste</a>
    </header>

    @if (loading()) {
      <app-spinner label="Chargement du client…" />
    } @else {
      @if (loadError()) {
        <div class="state is-error">
          <app-icon name="alert" [size]="24" />
          <p>{{ loadError() }}</p>
          <a class="btn" routerLink="/clients">Retour à la liste</a>
        </div>
      } @else {
        <form class="form panel" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          @if (fs.banner(); as b) {
            <div class="banner is-error" role="alert"><app-icon name="alert" [size]="18" /> <span>{{ b }}</span></div>
          }
          <div class="form-grid">
            <div class="field">
              <label for="nom">Nom *</label>
              <input id="nom" formControlName="nom" autocomplete="family-name" [class.bad]="!!fs.fieldError('nom')" />
              <span class="er">{{ fs.fieldError('nom') }}</span>
            </div>
            <div class="field">
              <label for="prenom">Prénom *</label>
              <input id="prenom" formControlName="prenom" autocomplete="given-name" [class.bad]="!!fs.fieldError('prenom')" />
              <span class="er">{{ fs.fieldError('prenom') }}</span>
            </div>
            <div class="field">
              <label for="telephone">Téléphone *</label>
              <input
                id="telephone"
                formControlName="telephone"
                inputmode="numeric"
                autocomplete="tel"
                placeholder="6XXXXXXXX"
                [class.bad]="!!fs.fieldError('telephone')"
              />
              <span class="er">{{ fs.fieldError('telephone') }}</span>
            </div>
            <div class="field">
              <label for="email">E-mail</label>
              <input id="email" type="email" formControlName="email" autocomplete="email" [class.bad]="!!fs.fieldError('email')" />
              <span class="er">{{ fs.fieldError('email') }}</span>
            </div>
            <div class="field">
              <label for="ville">Ville</label>
              <input id="ville" formControlName="ville" [class.bad]="!!fs.fieldError('ville')" />
              <span class="er">{{ fs.fieldError('ville') }}</span>
            </div>
            <div class="field">
              <label for="dateInscription">Date d'inscription *</label>
              <input id="dateInscription" type="date" formControlName="dateInscription" [max]="today" [class.bad]="!!fs.fieldError('dateInscription')" />
              <span class="er">{{ fs.fieldError('dateInscription') }}</span>
            </div>
          </div>
          <div class="form-actions">
            <a class="btn" routerLink="/clients">Annuler</a>
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
export class ClientFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly svc = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificationService);

  protected readonly id = routeId(this.route);
  protected readonly today = todayIso();
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    telephone: [
      '',
      [Validators.required, patternWithMessage(/^6\d{8}$/, 'Le téléphone doit avoir 9 chiffres et commencer par 6.')],
    ],
    email: ['', [Validators.email]],
    ville: ['', [Validators.maxLength(60)]],
    dateInscription: [todayIso(), [Validators.required, notFutureDate]],
  });

  protected readonly fs = new FormSupport(this.form, 'telephone');

  constructor() {
    if (this.id !== null) {
      this.loading.set(true);
      this.svc.get(this.id).subscribe({
        next: (c) => {
          this.form.patchValue({
            nom: c.nom,
            prenom: c.prenom,
            telephone: c.telephone,
            email: c.email ?? '',
            ville: c.ville ?? '',
            dateInscription: c.dateInscription,
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
    const body: ClientRequest = {
      nom: v.nom.trim(),
      prenom: v.prenom.trim(),
      telephone: v.telephone.trim(),
      email: v.email.trim() === '' ? null : v.email.trim(),
      ville: v.ville.trim() === '' ? null : v.ville.trim(),
      dateInscription: v.dateInscription,
    };
    this.fs.begin();
    const call$ = this.id === null ? this.svc.create(body) : this.svc.update(this.id, body);
    call$.subscribe({
      next: () => {
        this.notif.success(this.id === null ? 'Client créé.' : 'Client modifié.');
        this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (err: unknown) => this.fs.fail(err),
    });
  }
}
