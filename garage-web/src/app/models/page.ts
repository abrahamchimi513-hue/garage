/** Page renvoyée par toutes les listes paginées de l'API. */
export interface Page<T> {
  contenu: T[];
  /** Numéro de page, à partir de 0. */
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}
