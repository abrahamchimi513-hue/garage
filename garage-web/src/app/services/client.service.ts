import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Client, ClientRequest } from '../models/client';
import { Page } from '../models/page';
import { Vehicule } from '../models/vehicule';
import { toParams } from '../utils/http-params';

export type ClientQuery = { page: number; taille: number; recherche?: string };

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/clients`;

  list(query: ClientQuery): Observable<Page<Client>> {
    return this.http.get<Page<Client>>(this.url, { params: toParams(query) });
  }

  /** Tous les clients (pour les listes déroulantes). */
  all(): Observable<Client[]> {
    return this.list({ page: 0, taille: 500 }).pipe(map((p) => p.contenu));
  }

  get(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.url}/${id}`);
  }

  create(client: ClientRequest): Observable<Client> {
    return this.http.post<Client>(this.url, client);
  }

  update(id: number, client: ClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.url}/${id}`, client);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  vehicules(id: number): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.url}/${id}/vehicules`);
  }
}
