import { ActivatedRoute } from '@angular/router';

/** Lit le paramètre :id de la route, ou null s'il n'y en a pas (mode création). */
export function routeId(route: ActivatedRoute): number | null {
  const raw = route.snapshot.paramMap.get('id');
  if (raw === null) {
    return null;
  }
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}
