import { TypeIntervention } from './enums';

export interface LigneIntervention {
  id: number;
  pieceId: number;
  pieceReference?: string;
  pieceDesignation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Intervention {
  id: number;
  vehiculeId: number;
  type: TypeIntervention;
  description: string;
  dateDebut: string;
  dateFin: string | null;
  mainOeuvre: number;
  lignes: LigneIntervention[];
  total: number;
}

export interface InterventionRequest {
  vehiculeId: number;
  type: TypeIntervention;
  description: string;
  dateDebut: string;
  dateFin: string | null;
  mainOeuvre: number;
}

export interface LigneRequest {
  pieceId: number;
  quantite: number;
}
