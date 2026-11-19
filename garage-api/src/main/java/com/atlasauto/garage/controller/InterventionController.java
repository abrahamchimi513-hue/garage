package com.atlasauto.garage.controller;

import com.atlasauto.garage.dto.InterventionRequest;
import com.atlasauto.garage.dto.InterventionResponse;
import com.atlasauto.garage.dto.LigneRequest;
import com.atlasauto.garage.dto.Statistiques.InterventionStats;
import com.atlasauto.garage.service.InterventionService;
import com.atlasauto.garage.service.StatistiquesService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interventions")
public class InterventionController {

    private final InterventionService service;
    private final StatistiquesService statistiques;

    public InterventionController(InterventionService service, StatistiquesService statistiques) {
        this.service = service;
        this.statistiques = statistiques;
    }

    @GetMapping("/statistiques")
    public InterventionStats statistiques() {
        return statistiques.interventions();
    }

    @GetMapping("/{id}")
    public InterventionResponse lire(@PathVariable Long id) {
        return service.lire(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InterventionResponse creer(@Valid @RequestBody InterventionRequest req) {
        return service.creer(req);
    }

    @PutMapping("/{id}")
    public InterventionResponse modifier(@PathVariable Long id, @Valid @RequestBody InterventionRequest req) {
        return service.modifier(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.supprimer(id);
    }

    @PostMapping("/{id}/lignes")
    @ResponseStatus(HttpStatus.CREATED)
    public InterventionResponse ajouterLigne(@PathVariable Long id, @Valid @RequestBody LigneRequest req) {
        return service.ajouterLigne(id, req);
    }

    @DeleteMapping("/{id}/lignes/{ligneId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void retirerLigne(@PathVariable Long id, @PathVariable Long ligneId) {
        service.retirerLigne(id, ligneId);
    }
}
