package com.atlasauto.garage.controller;

import com.atlasauto.garage.dto.*;
import com.atlasauto.garage.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService service;

    public ClientController(ClientService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<ClientResponse> lister(@RequestParam(required = false) String recherche,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int taille) {
        return service.lister(recherche, page, taille);
    }

    @GetMapping("/{id}")
    public ClientResponse lire(@PathVariable Long id) {
        return service.lire(id);
    }

    @GetMapping("/{id}/vehicules")
    public List<VehiculeResponse> vehicules(@PathVariable Long id) {
        return service.vehiculesDuClient(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientResponse creer(@Valid @RequestBody ClientRequest req) {
        return service.creer(req);
    }

    @PutMapping("/{id}")
    public ClientResponse modifier(@PathVariable Long id, @Valid @RequestBody ClientRequest req) {
        return service.modifier(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.supprimer(id);
    }
}
