package com.atlasauto.garage.service;

import com.atlasauto.garage.dto.*;
import com.atlasauto.garage.entity.*;

/** Conversion entité → DTO. À appeler dans une transaction (les relations LAZY sont lues ici). */
public final class Mapper {

    private Mapper() {
    }

    public static ClientResponse versDto(Client c) {
        return new ClientResponse(c.getId(), c.getNom(), c.getPrenom(), c.getTelephone(), c.getEmail(),
                c.getVille(), c.getDateInscription());
    }

    public static VehiculeResponse versDto(Vehicule v) {
        return new VehiculeResponse(v.getId(), v.getImmatriculation(), v.getMarque(), v.getModele(), v.getAnnee(),
                v.getKilometrage(), v.getCarburant(), v.getStatut(), v.getDateEntree(), v.getCoutEstime(),
                v.getPanne(), v.getClient().getId(), v.getClient().getNomComplet());
    }

    public static PieceResponse versDto(Piece p) {
        return new PieceResponse(p.getId(), p.getReference(), p.getDesignation(), p.getCategorie(), p.getFabricant(),
                p.getPrixUnitaire(), p.getQuantiteStock(), p.getSeuilAlerte(), p.getDateAchat(),
                p.getQuantiteStock() <= p.getSeuilAlerte());
    }

    public static LigneResponse versDto(LigneIntervention l) {
        Piece p = l.getPiece();
        return new LigneResponse(l.getId(), p.getId(), p.getReference(), p.getDesignation(), l.getQuantite(),
                l.getPrixUnitaire(), l.getSousTotal());
    }

    public static InterventionResponse versDto(Intervention i) {
        return new InterventionResponse(i.getId(), i.getVehicule().getId(), i.getType(), i.getDescription(),
                i.getDateDebut(), i.getDateFin(), i.getMainOeuvre(),
                i.getLignes().stream().map(Mapper::versDto).toList(), i.getTotal());
    }
}
