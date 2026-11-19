import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Intervention, InterventionRequest, LigneRequest } from '../models/intervention';
import { InterventionStats } from '../models/stats';

@Injectable({ providedIn: 'root' })
export class InterventionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/interventions`;

  /** Historique d'un véhicule, avec lignes et totaux. */
  forVehicule(vehiculeId: number): Observable<Intervention[]> {
    return this.http.get<Intervention[]>(`${environment.apiUrl}/vehicules/${vehiculeId}/interventions`);
  }

  create(intervention: InterventionRequest): Observable<Intervention> {
    return this.http.post<Intervention>(this.url, intervention);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  addLigne(interventionId: number, ligne: LigneRequest): Observable<Intervention> {
    return this.http.post<Intervention>(`${this.url}/${interventionId}/lignes`, ligne);
  }

  removeLigne(interventionId: number, ligneId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${interventionId}/lignes/${ligneId}`);
  }

  statistiques(): Observable<InterventionStats> {
    return this.http.get<InterventionStats>(`${this.url}/statistiques`);
  }
}
