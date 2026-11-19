package com.atlasauto.garage.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** Petits outils communs aux recherches paginées. */
final class Recherche {

    static final int TAILLE_MAX = 100;

    private Recherche() {
    }

    /** Minuscules + % de chaque côté. Le motif est ensuite passé comme PARAMÈTRE de la requête (jamais concaténé en SQL). */
    static String motif(String recherche) {
        String texte = recherche == null ? "" : recherche.trim().toLowerCase();
        return "%" + texte + "%";
    }

    static Pageable page(int page, int taille) {
        int p = Math.max(page, 0);
        int t = Math.min(Math.max(taille, 1), TAILLE_MAX);
        return PageRequest.of(p, t, Sort.by("id"));
    }
}
