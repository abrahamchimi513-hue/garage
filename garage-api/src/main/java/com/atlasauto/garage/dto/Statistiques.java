package com.atlasauto.garage.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** DTO des trois points d'accès de statistiques. Tout est calculé en base. */
public final class Statistiques {

    private Statistiques() {
    }

    public record Compteur(String libelle, long nombre) {
    }

    public record VehiculeStats(long total, Map<String, Long> parStatut, Map<String, Long> parCarburant,
                                List<Compteur> topMarques, double kilometrageMoyen,
                                BigDecimal coutEstimeEnReparation, long entresCeMois) {
    }

    public record CategorieStat(String categorie, long nombre, BigDecimal valeur) {
    }

    public record PieceStats(long nombreReferences, long quantiteTotale, BigDecimal valeurStock, long enAlerte,
                             List<CategorieStat> parCategorie, PieceResponse pieceLaPlusChere) {
    }

    public record ClientTop(Long clientId, String nom, BigDecimal montant) {
    }

    public record PieceTop(Long pieceId, String reference, String designation, long quantiteUtilisee) {
    }

    public record InterventionStats(long nombreClients, long nombreInterventions, BigDecimal chiffreAffairesMois,
                                    BigDecimal coutMoyen, List<ClientTop> topClients, List<PieceTop> topPieces,
                                    long vehiculesSansIntervention) {
    }
}
