import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Date du jour au format AAAA-MM-JJ (fuseau local). */
export function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const notFutureDate: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  const v: unknown = c.value;
  return typeof v === 'string' && v !== '' && v > todayIso()
    ? { custom: 'La date ne peut pas être dans le futur.' }
    : null;
};

export const strictlyPositive: ValidatorFn = (c: AbstractControl): ValidationErrors | null => {
  const v: unknown = c.value;
  return typeof v === 'number' && v <= 0
    ? { custom: 'La valeur doit être strictement supérieure à 0.' }
    : null;
};

export function patternWithMessage(re: RegExp, message: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const v: unknown = c.value;
    return typeof v === 'string' && v !== '' && !re.test(v) ? { custom: message } : null;
  };
}

/** La date de ce champ ne doit pas précéder celle du champ frère `otherKey`. */
export function notBeforeSibling(otherKey: string, message: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const v: unknown = c.value;
    const other: unknown = c.parent?.get(otherKey)?.value;
    return typeof v === 'string' && v !== '' && typeof other === 'string' && other !== '' && v < other
      ? { custom: message }
      : null;
  };
}
