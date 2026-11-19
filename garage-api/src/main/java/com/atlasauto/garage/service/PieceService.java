package com.atlasauto.garage.service;

import com.atlasauto.garage.dto.*;
import com.atlasauto.garage.entity.Piece;
import com.atlasauto.garage.enums.CategoriePiece;
import com.atlasauto.garage.enums.TypeMouvement;
import com.atlasauto.garage.exception.ConflictException;
import com.atlasauto.garage.exception.NotFoundException;
import com.atlasauto.garage.repository.LigneInterventionRepository;
import com.atlasauto.garage.repository.PieceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PieceService {

    private final PieceRepository pieces;
    private final LigneInterventionRepository lignes;

    public PieceService(PieceRepository pieces, LigneInterventionRepository lignes) {
        this.pieces = pieces;
        this.lignes = lignes;
    }

    @Transactional(readOnly = true)
    public PageResponse<PieceResponse> lister(String recherche, CategoriePiece categorie, int page, int taille) {
        return PageResponse.de(pieces.rechercher(Recherche.motif(recherche), categorie, Recherche.page(page, taille))
                .map(Mapper::versDto));
    }

    @Transactional(readOnly = true)
    public PieceResponse lire(Long id) {
        return Mapper.versDto(trouver(id));
    }

    @Transactional(readOnly = true)
    public List<PieceResponse> alertes() {
        return pieces.findEnAlerte().stream().map(Mapper::versDto).toList();
    }

    public PieceResponse creer(PieceRequest req) {
        if (pieces.existsByReference(req.reference())) {
            throw new ConflictException("reference", "Cette référence existe déjà");
        }
        Piece p = new Piece();
        copier(req, p);
        return Mapper.versDto(pieces.save(p));
    }

    public PieceResponse modifier(Long id, PieceRequest req) {
        Piece p = trouver(id);
        if (pieces.existsByReferenceAndIdNot(req.reference(), id)) {
            throw new ConflictException("reference", "Cette référence existe déjà");
        }
        copier(req, p);
        return Mapper.versDto(p);
    }

    public void supprimer(Long id) {
        Piece p = trouver(id);
        if (lignes.existsByPieceId(id)) {
            throw new ConflictException("Suppression impossible : cette pièce est utilisée dans une intervention");
        }
        pieces.delete(p);
    }

    /** Entrée ou sortie de stock. La quantité ne devient jamais négative. */
    public PieceResponse mouvementStock(Long id, TypeMouvement type, int quantite) {
        Piece p = pieces.findByIdPourMiseAJour(id).orElseThrow(() -> NotFoundException.de("Pièce", id));
        if (type == TypeMouvement.SORTIE) {
            if (quantite > p.getQuantiteStock()) {
                throw new ConflictException("quantite",
                        "Stock insuffisant : " + p.getQuantiteStock() + " disponible(s), " + quantite + " demandé(s)");
            }
            p.setQuantiteStock(p.getQuantiteStock() - quantite);
        } else {
            p.setQuantiteStock(p.getQuantiteStock() + quantite);
        }
        return Mapper.versDto(p);
    }

    Piece trouver(Long id) {
        return pieces.findById(id).orElseThrow(() -> NotFoundException.de("Pièce", id));
    }

    private void copier(PieceRequest req, Piece p) {
        p.setReference(req.reference());
        p.setDesignation(req.designation().trim());
        p.setCategorie(req.categorie());
        p.setFabricant(req.fabricant().trim());
        p.setPrixUnitaire(req.prixUnitaire());
        p.setQuantiteStock(req.quantiteStock());
        p.setSeuilAlerte(req.seuilAlerte());
        p.setDateAchat(req.dateAchat());
    }
}
