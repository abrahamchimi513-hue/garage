package com.atlasauto.garage.controller;

import com.atlasauto.garage.dto.*;
import com.atlasauto.garage.dto.Statistiques.VehiculeStats;
import com.atlasauto.garage.enums.StatutVehicule;
import com.atlasauto.garage.service.InterventionService;
import com.atlasauto.garage.service.StatistiquesService;
import com.atlasauto.garage.service.VehiculeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicules")
public class VehiculeController {

    private final VehiculeService service;
    private final InterventionService interventions;
    private final StatistiquesService statistiques;

    public VehiculeController(VehiculeService service, InterventionService interventions,
                              StatistiquesService statistiques) {
        this.service = service;
        this.interventions = interventions;
        this.statistiques = statistiques;
    }

    @GetMapping
    public PageResponse<VehiculeResponse> lister(@RequestParam(required = false) String recherche,
                                                 @RequestParam(required = false) StatutVehicule statut,
                                                 @RequestParam(required = false) Long clientId,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int taille) {
        return service.lister(recherche, statut, clientId, page, taille);
    }

    @GetMapping("/statistiques")
    public VehiculeStats statistiques() {
        return statistiques.vehicules();
    }

    @GetMapping("/{id}")
    public VehiculeResponse lire(@PathVariable Long id) {
        return service.lire(id);
    }

    @GetMapping("/{id}/interventions")
    public List<InterventionResponse> historique(@PathVariable Long id) {
        return interventions.historiqueDuVehicule(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VehiculeResponse creer(@Valid @RequestBody VehiculeRequest req) {
        return service.creer(req);
    }

    @PutMapping("/{id}")
    public VehiculeResponse modifier(@PathVariable Long id, @Valid @RequestBody VehiculeRequest req) {
        return service.modifier(id, req);
    }

    @PatchMapping("/{id}/statut")
    public VehiculeResponse changerStatut(@PathVariable Long id, @Valid @RequestBody StatutRequest req) {
        return service.changerStatut(id, req.statut());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.supprimer(id);
    }
}
