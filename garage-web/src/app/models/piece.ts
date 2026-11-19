import { CategoriePiece } from './enums';

export interface Piece {
  id: number;
  reference: string;
  designation: string;
  categorie: CategoriePiece;
  fabricant: string;
  prixUnitaire: number;
  quantiteStock: number;
  seuilAlerte: number;
  dateAchat: string;
}

export type PieceRequest = Omit<Piece, 'id'>;

export type TypeMouvement = 'ENTREE' | 'SORTIE';

export interface MouvementStock {
  type: TypeMouvement;
  quantite: number;
}

export function enAlerte(p: Piece): boolean {
  return p.quantiteStock <= p.seuilAlerte;
}
