import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CategoriePiece } from '../models/enums';
import { Page } from '../models/page';
import { MouvementStock, Piece, PieceRequest } from '../models/piece';
import { PieceStats } from '../models/stats';
import { toParams } from '../utils/http-params';

export type PieceQuery = {
  page: number;
  taille: number;
  recherche?: string;
  categorie?: CategoriePiece | '';
};

@Injectable({ providedIn: 'root' })
export class PieceService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pieces`;

  list(query: PieceQuery): Observable<Page<Piece>> {
    return this.http.get<Page<Piece>>(this.url, { params: toParams(query) });
  }

  /** Toutes les pièces (liste déroulante de la fiche véhicule). */
  all(): Observable<Piece[]> {
    return this.list({ page: 0, taille: 500 }).pipe(map((p) => p.contenu));
  }

  get(id: number): Observable<Piece> {
    return this.http.get<Piece>(`${this.url}/${id}`);
  }

  create(piece: PieceRequest): Observable<Piece> {
    return this.http.post<Piece>(this.url, piece);
  }

  update(id: number, piece: PieceRequest): Observable<Piece> {
    return this.http.put<Piece>(`${this.url}/${id}`, piece);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  mouvementStock(id: number, mouvement: MouvementStock): Observable<Piece> {
    return this.http.patch<Piece>(`${this.url}/${id}/stock`, mouvement);
  }

  alertes(): Observable<Piece[]> {
    return this.http.get<Piece[]>(`${this.url}/alertes`);
  }

  statistiques(): Observable<PieceStats> {
    return this.http.get<PieceStats>(`${this.url}/statistiques`);
  }
}
