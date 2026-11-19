import { Pipe, PipeTransform } from '@angular/core';
import { libelle } from '../models/enums';

/** 12500 -> « 12 500 FCFA » (jamais NaN). */
@Pipe({ name: 'fcfa' })
export class FcfaPipe implements PipeTransform {
  private readonly nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

  transform(value: number | null | undefined): string {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return `${this.nf.format(n)} FCFA`;
  }
}

/** ENUM_SERVEUR -> libellé français. */
@Pipe({ name: 'libelle' })
export class LibellePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return libelle(value);
  }
}

/** Pourcentage de largeur de barre ; 0 si la base est nulle (pas de NaN). */
export function pct(value: number, base: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(base) || base <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((value / base) * 100)));
}
