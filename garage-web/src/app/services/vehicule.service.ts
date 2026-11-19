import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Statut } from '../models/enums';
import { Page } from '../models/page';
import { VehiculeStats } from '../models/stats';
import { Vehicule, VehiculeRequest } from '../models/vehicule';
import { toParams } from '../utils/http-params';

export type VehiculeQuery = {
  page: number;
  taille: number;
  recherche?: string;
  statut?: Statut | '';
  clientId?: number | '';
};

@Injectable({ providedIn: 'root' })
export class VehiculeService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/vehicules`;

  list(query: VehiculeQuery): Observable<Page<Vehicule>> {
    return this.http.get<Page<Vehicule>>(this.url, { params: toParams(query) });
  }

  get(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.url}/${id}`);
  }

  create(vehicule: VehiculeRequest): Observable<Vehicule> {
    return this.http.post<Vehicule>(this.url, vehicule);
  }

  update(id: number, vehicule: VehiculeRequest): Observable<Vehicule> {
    return this.http.put<Vehicule>(`${this.url}/${id}`, vehicule);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  changerStatut(id: number, statut: Statut): Observable<Vehicule> {
    return this.http.patch<Vehicule>(`${this.url}/${id}/statut`, { statut });
  }

  statistiques(): Observable<VehiculeStats> {
    return this.http.get<VehiculeStats>(`${this.url}/statistiques`);
  }
}
