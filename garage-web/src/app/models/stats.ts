/**
 * Contrat attendu des trois points /statistiques.
 * Si votre back utilise d'autres noms, adaptez UNIQUEMENT ce fichier
 * et le tableau de bord.
 */
export interface VehiculeStats {
  total: number;
  parStatut: Record<string, number>;
  parCarburant: Record<string, number>;
  topMarques: { libelle: string; nombre: number }[];
  kilometrageMoyen: number;
  coutEstimeEnReparation: number;
  entresCeMois: number;
}

export interface PieceStats {
  nombreReferences: number;
  quantiteTotale: number;
  valeurStock: number;
  enAlerte: number;
  parCategorie: { categorie: string; nombre: number; valeur: number }[];
  pieceLaPlusChere: { reference: string; designation: string; prixUnitaire: number } | null;
}

export interface InterventionStats {
  nombreClients: number;
  topClients: { clientId: number; nom: string; montant: number }[];
  nombreInterventions: number;
  chiffreAffairesMois: number;
  coutMoyen: number;
  topPieces: { pieceId: number; reference: string; designation: string; quantiteUtilisee: number }[];
  vehiculesSansIntervention: number;
}
