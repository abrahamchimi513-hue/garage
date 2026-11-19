export const STATUTS = ['EN_ATTENTE', 'EN_REPARATION', 'TERMINE', 'LIVRE'] as const;
export type Statut = (typeof STATUTS)[number];

export const CARBURANTS = ['ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE'] as const;
export type Carburant = (typeof CARBURANTS)[number];

export const CATEGORIES = [
  'MOTEUR',
  'FREINAGE',
  'SUSPENSION',
  'ELECTRICITE',
  'CARROSSERIE',
  'ENTRETIEN',
] as const;
export type CategoriePiece = (typeof CATEGORIES)[number];

export const TYPES_INTERVENTION = [
  'VIDANGE',
  'FREINS',
  'MOTEUR',
  'ELECTRICITE',
  'CARROSSERIE',
  'DIAGNOSTIC',
] as const;
export type TypeIntervention = (typeof TYPES_INTERVENTION)[number];

/** Transitions de statut permises (le serveur reste l'autorité). */
export const TRANSITIONS: Record<Statut, readonly Statut[]> = {
  EN_ATTENTE: ['EN_REPARATION'],
  EN_REPARATION: ['TERMINE'],
  TERMINE: ['LIVRE', 'EN_REPARATION'],
  LIVRE: [],
};

const LIBELLES: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_REPARATION: 'En réparation',
  TERMINE: 'Terminé',
  LIVRE: 'Livré',
  ESSENCE: 'Essence',
  DIESEL: 'Diesel',
  ELECTRIQUE: 'Électrique',
  HYBRIDE: 'Hybride',
  MOTEUR: 'Moteur',
  FREINAGE: 'Freinage',
  SUSPENSION: 'Suspension',
  ELECTRICITE: 'Électricité',
  CARROSSERIE: 'Carrosserie',
  ENTRETIEN: 'Entretien',
  VIDANGE: 'Vidange',
  FREINS: 'Freins',
  DIAGNOSTIC: 'Diagnostic',
};

export function libelle(valeur: string | null | undefined): string {
  if (!valeur) {
    return '';
  }
  return LIBELLES[valeur] ?? valeur;
}
