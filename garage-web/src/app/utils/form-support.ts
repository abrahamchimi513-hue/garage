import { signal } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { take } from 'rxjs';
import { parseApiError } from './server-errors';

/** Message français pour la première erreur d'un contrôle. */
export function messageFor(control: AbstractControl): string | null {
  const e = control.errors;
  if (!e) {
    return null;
  }
  if (e['required']) {
    return 'Ce champ est obligatoire.';
  }
  if (e['custom']) {
    return String(e['custom']);
  }
  if (e['minlength']) {
    return `Minimum ${(e['minlength'] as { requiredLength: number }).requiredLength} caractères.`;
  }
  if (e['maxlength']) {
    return `Maximum ${(e['maxlength'] as { requiredLength: number }).requiredLength} caractères.`;
  }
  if (e['min']) {
    return `La valeur minimale est ${(e['min'] as { min: number }).min}.`;
  }
  if (e['max']) {
    return `La valeur maximale est ${(e['max'] as { max: number }).max}.`;
  }
  if (e['email']) {
    return 'Adresse e-mail invalide.';
  }
  return 'Valeur invalide.';
}

/**
 * Regroupe l'état d'un formulaire : erreurs du serveur par champ, bandeau,
 * envoi en cours. Utilisé par tous les formulaires du projet.
 */
export class FormSupport<T extends { [K in keyof T]: AbstractControl }> {
  readonly serverErrors = signal<Record<string, string>>({});
  readonly banner = signal<string | null>(null);
  readonly submitting = signal(false);

  /**
   * @param conflictField champ auquel rattacher une erreur 409 sans détail
   *                      (ex. immatriculation en double).
   */
  constructor(
    readonly form: FormGroup<T>,
    private readonly conflictField: string | null = null,
  ) {}

  fieldError(name: string): string | null {
    const fromServer = this.serverErrors()[name];
    if (fromServer) {
      return fromServer;
    }
    const control = this.form.get(name);
    if (control && control.invalid && (control.touched || control.dirty)) {
      return messageFor(control);
    }
    return null;
  }

  /** Marque tout comme touché ; renvoie false si le formulaire est invalide. */
  validate(): boolean {
    this.banner.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.banner.set('Veuillez corriger les champs signalés.');
      return false;
    }
    return true;
  }

  begin(): void {
    this.banner.set(null);
    this.submitting.set(true);
  }

  fail(err: unknown): void {
    const parsed = parseApiError(err);
    this.submitting.set(false);

    const fields: Record<string, string> = { ...parsed.fieldErrors };
    if (parsed.status === 409 && Object.keys(fields).length === 0 && this.conflictField) {
      fields[this.conflictField] = parsed.message;
    }

    const mapped: Record<string, string> = {};
    const orphans: string[] = [];
    for (const [name, message] of Object.entries(fields)) {
      if (this.form.get(name)) {
        mapped[name] = message;
      } else {
        orphans.push(message);
      }
    }
    this.serverErrors.set(mapped);

    // L'erreur disparaît dès que l'utilisateur corrige le champ.
    for (const name of Object.keys(mapped)) {
      this.form
        .get(name)
        ?.valueChanges.pipe(take(1))
        .subscribe(() => {
          this.serverErrors.update((current) => {
            const { [name]: _removed, ...rest } = current;
            return rest;
          });
        });
    }

    if (Object.keys(mapped).length === 0) {
      this.banner.set(parsed.message);
    } else if (orphans.length > 0) {
      this.banner.set(orphans.join(' '));
    } else if (parsed.status === 400) {
      this.banner.set('Certains champs sont invalides. Corrigez-les puis réessayez.');
    } else {
      this.banner.set(null);
    }
  }
}
