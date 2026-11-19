package com.atlasauto.garage.service;

import com.atlasauto.garage.dto.InterventionRequest;
import com.atlasauto.garage.dto.InterventionResponse;
import com.atlasauto.garage.dto.LigneRequest;
import com.atlasauto.garage.entity.Intervention;
import com.atlasauto.garage.entity.LigneIntervention;
import com.atlasauto.garage.entity.Piece;
import com.atlasauto.garage.entity.Vehicule;
import com.atlasauto.garage.enums.StatutVehicule;
import com.atlasauto.garage.exception.ConflictException;
import com.atlasauto.garage.exception.DonneesInvalidesException;
import com.atlasauto.garage.exception.NotFoundException;
import com.atlasauto.garage.repository.InterventionRepository;
import com.atlasauto.garage.repository.LigneInterventionRepository;
import com.atlasauto.garage.repository.PieceRepository;
import com.atlasauto.garage.repository.VehiculeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class InterventionService {

    private final InterventionRepository interventions;
    private final LigneInterventionRepository lignes;
    private final VehiculeRepository vehicules;
    private final PieceRepository pieces;

    public InterventionService(InterventionRepository interventions, LigneInterventionRepository lignes,
                               VehiculeRepository vehicules, PieceRepository pieces) {
        this.interventions = interventions;
        this.lignes = lignes;
        this.vehicules = vehicules;
        this.pieces = pieces;
    }

    @Transactional(readOnly = true)
    public InterventionResponse lire(Long id) {
        return Mapper.versDto(trouver(id));
    }

    @Transactional(readOnly = true)
    public List<InterventionResponse> historiqueDuVehicule(Long vehiculeId) {
        if (!vehicules.existsById(vehiculeId)) {
            throw NotFoundException.de("Véhicule", vehiculeId);
        }
        return interventions.findDetailParVehicule(vehiculeId).stream().map(Mapper::versDto).toList();
    }

    public InterventionResponse creer(InterventionRequest req) {
        verifierDates(req);
        Vehicule v = vehiculeAutorise(req.vehiculeId());
        Intervention i = new Intervention();
        copier(req, i, v);
        return Mapper.versDto(interventions.save(i));
    }

    public InterventionResponse modifier(Long id, InterventionRequest req) {
        verifierDates(req);
        Intervention i = trouver(id);
        Vehicule v = i.getVehicule();
        if (!v.getId().equals(req.vehiculeId())) {
            v = vehiculeAutorise(req.vehiculeId());
        }
        copier(req, i, v);
        return Mapper.versDto(i);
    }

    /** Supprime l'intervention (lignes en cascade) et restitue le stock de chaque pièce. */
    public void supprimer(Long id) {
        Intervention i = trouver(id);
        for (LigneIntervention l : i.getLignes()) {
            Piece p = l.getPiece();
            p.setQuantiteStock(p.getQuantiteStock() + l.getQuantite());
        }
        interventions.delete(i);
    }

    /**
     * Ajout d'une pièce à une intervention, en UNE transaction : vérifier le stock, le diminuer,
     * copier le prix actuel. Si une étape échoue, rien n'est enregistré.
     */
    public InterventionResponse ajouterLigne(Long interventionId, LigneRequest req) {
        Intervention i = trouver(interventionId);
        Piece p = pieces.findByIdPourMiseAJour(req.pieceId())
                .orElseThrow(() -> NotFoundException.de("Pièce", req.pieceId()));

        if (lignes.existsByInterventionIdAndPieceId(interventionId, p.getId())) {
            throw new ConflictException("pieceId",
                    "Cette pièce est déjà sur l'intervention : retirez la ligne puis ajoutez-la à nouveau");
        }
        if (req.quantite() > p.getQuantiteStock()) {
            throw new ConflictException("quantite",
                    "Stock insuffisant : " + p.getQuantiteStock() + " disponible(s), " + req.quantite() + " demandé(s)");
        }

        p.setQuantiteStock(p.getQuantiteStock() - req.quantite());

        LigneIntervention l = new LigneIntervention();
        l.setIntervention(i);
        l.setPiece(p);
        l.setQuantite(req.quantite());
        l.setPrixUnitaire(p.getPrixUnitaire()); // prix figé : une facture passée ne change pas
        i.getLignes().add(l);

        interventions.saveAndFlush(i);
        return Mapper.versDto(i);
    }

    /** Retire une ligne et restitue son stock. */
    public void retirerLigne(Long interventionId, Long ligneId) {
        Intervention i = trouver(interventionId);
        LigneIntervention l = i.getLignes().stream()
                .filter(x -> x.getId().equals(ligneId))
                .findFirst()
                .orElseThrow(() -> NotFoundException.de("Ligne d'intervention", ligneId));
        Piece p = pieces.findByIdPourMiseAJour(l.getPiece().getId()).orElseThrow();
        p.setQuantiteStock(p.getQuantiteStock() + l.getQuantite());
        i.getLignes().remove(l); // orphanRemoval supprime la ligne en base
    }

    private Intervention trouver(Long id) {
        return interventions.findDetail(id).orElseThrow(() -> NotFoundException.de("Intervention", id));
    }

    private Vehicule vehiculeAutorise(Long vehiculeId) {
        Vehicule v = vehicules.findAvecClient(vehiculeId)
                .orElseThrow(() -> NotFoundException.de("Véhicule", vehiculeId));
        if (v.getStatut() == StatutVehicule.LIVRE) {
            throw new ConflictException("vehiculeId", "Ce véhicule est déjà livré : aucune intervention possible");
        }
        return v;
    }

    private void verifierDates(InterventionRequest req) {
        if (req.dateFin() != null && req.dateFin().isBefore(req.dateDebut())) {
            throw new DonneesInvalidesException("dateFin", "La date de fin ne peut pas précéder la date de début");
        }
    }

    private void copier(InterventionRequest req, Intervention i, Vehicule v) {
        i.setVehicule(v);
        i.setType(req.type());
        i.setDescription(req.description().trim());
        i.setDateDebut(req.dateDebut());
        i.setDateFin(req.dateFin());
        i.setMainOeuvre(req.mainOeuvre());
    }
}
