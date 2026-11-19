import { Carburant, Statut } from './enums';

export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  kilometrage: number;
  carburant: Carburant;
  statut: Statut;
  dateEntree: string;
  coutEstime: number;
  panne: string | null;
  clientId: number;
  clientNom: string;
}

export type VehiculeRequest = Omit<Vehicule, 'id' | 'clientNom'>;
