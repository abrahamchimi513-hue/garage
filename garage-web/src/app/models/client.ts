export interface Client {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  ville: string | null;
  dateInscription: string;
}

export type ClientRequest = Omit<Client, 'id'>;
