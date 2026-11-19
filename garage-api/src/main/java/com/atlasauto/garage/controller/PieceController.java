package com.atlasauto.garage.controller;

import com.atlasauto.garage.dto.*;
import com.atlasauto.garage.dto.Statistiques.PieceStats;
import com.atlasauto.garage.enums.CategoriePiece;
import com.atlasauto.garage.service.PieceService;
import com.atlasauto.garage.service.StatistiquesService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pieces")
public class PieceController {

    private final PieceService service;
    private final StatistiquesService statistiques;

    public PieceController(PieceService service, StatistiquesService statistiques) {
        this.service = service;
        this.statistiques = statistiques;
    }

    @GetMapping
    public PageResponse<PieceResponse> lister(@RequestParam(required = false) String recherche,
                                              @RequestParam(required = false) CategoriePiece categorie,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int taille) {
        return service.lister(recherche, categorie, page, taille);
    }

    @GetMapping("/alertes")
    public List<PieceResponse> alertes() {
        return service.alertes();
    }

    @GetMapping("/statistiques")
    public PieceStats statistiques() {
        return statistiques.pieces();
    }

    @GetMapping("/{id}")
    public PieceResponse lire(@PathVariable Long id) {
        return service.lire(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PieceResponse creer(@Valid @RequestBody PieceRequest req) {
        return service.creer(req);
    }

    @PutMapping("/{id}")
    public PieceResponse modifier(@PathVariable Long id, @Valid @RequestBody PieceRequest req) {
        return service.modifier(id, req);
    }

    @PatchMapping("/{id}/stock")
    public PieceResponse stock(@PathVariable Long id, @Valid @RequestBody StockRequest req) {
        return service.mouvementStock(id, req.type(), req.quantite());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.supprimer(id);
    }
}
