import { Routes } from '@angular/router';

/**
 * Les routes d'une entité sont imbriquées : ainsi la navigation relative « .. »
 * depuis un formulaire ramène bien à la liste. « nouveau » est déclaré avant « :id ».
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
  {
    path: 'tableau-de-bord',
    title: 'Tableau de bord · Atlas Auto',
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'vehicules',
    children: [
      {
        path: '',
        title: 'Véhicules · Atlas Auto',
        loadComponent: () => import('./pages/vehicules-list.page').then((m) => m.VehiculesListPage),
      },
      {
        path: 'nouveau',
        title: 'Nouveau véhicule · Atlas Auto',
        loadComponent: () => import('./pages/vehicule-form.page').then((m) => m.VehiculeFormPage),
      },
      {
        path: ':id/modifier',
        title: 'Modifier le véhicule · Atlas Auto',
        loadComponent: () => import('./pages/vehicule-form.page').then((m) => m.VehiculeFormPage),
      },
      {
        path: ':id',
        title: 'Fiche véhicule · Atlas Auto',
        loadComponent: () => import('./pages/vehicule-detail.page').then((m) => m.VehiculeDetailPage),
      },
    ],
  },
  {
    path: 'pieces',
    children: [
      {
        path: '',
        title: 'Pièces · Atlas Auto',
        loadComponent: () => import('./pages/pieces-list.page').then((m) => m.PiecesListPage),
      },
      {
        path: 'nouveau',
        title: 'Nouvelle pièce · Atlas Auto',
        loadComponent: () => import('./pages/piece-form.page').then((m) => m.PieceFormPage),
      },
      {
        path: ':id/modifier',
        title: 'Modifier la pièce · Atlas Auto',
        loadComponent: () => import('./pages/piece-form.page').then((m) => m.PieceFormPage),
      },
    ],
  },
  {
    path: 'clients',
    children: [
      {
        path: '',
        title: 'Clients · Atlas Auto',
        loadComponent: () => import('./pages/clients-list.page').then((m) => m.ClientsListPage),
      },
      {
        path: 'nouveau',
        title: 'Nouveau client · Atlas Auto',
        loadComponent: () => import('./pages/client-form.page').then((m) => m.ClientFormPage),
      },
      {
        path: ':id/modifier',
        title: 'Modifier le client · Atlas Auto',
        loadComponent: () => import('./pages/client-form.page').then((m) => m.ClientFormPage),
      },
    ],
  },
  {
    path: '**',
    title: 'Page introuvable · Atlas Auto',
    loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPage),
  },
];
