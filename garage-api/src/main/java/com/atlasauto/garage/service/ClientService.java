package com.atlasauto.garage.service;

import com.atlasauto.garage.dto.*;
import com.atlasauto.garage.entity.Client;
import com.atlasauto.garage.exception.ConflictException;
import com.atlasauto.garage.exception.NotFoundException;
import com.atlasauto.garage.repository.ClientRepository;
import com.atlasauto.garage.repository.VehiculeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ClientService {

    private final ClientRepository clients;
    private final VehiculeRepository vehicules;

    public ClientService(ClientRepository clients, VehiculeRepository vehicules) {
        this.clients = clients;
        this.vehicules = vehicules;
    }

    @Transactional(readOnly = true)
    public PageResponse<ClientResponse> lister(String recherche, int page, int taille) {
        return PageResponse.de(clients.rechercher(Recherche.motif(recherche), Recherche.page(page, taille))
                .map(Mapper::versDto));
    }

    @Transactional(readOnly = true)
    public ClientResponse lire(Long id) {
        return Mapper.versDto(trouver(id));
    }

    @Transactional(readOnly = true)
    public List<VehiculeResponse> vehiculesDuClient(Long id) {
        trouver(id); // 404 si le client n'existe pas
        return vehicules.findByClientIdAvecClient(id).stream().map(Mapper::versDto).toList();
    }

    public ClientResponse creer(ClientRequest req) {
        if (clients.existsByTelephone(req.telephone())) {
            throw new ConflictException("telephone", "Ce numéro de téléphone est déjà utilisé");
        }
        Client c = new Client();
        copier(req, c);
        return Mapper.versDto(clients.save(c));
    }

    public ClientResponse modifier(Long id, ClientRequest req) {
        Client c = trouver(id);
        if (clients.existsByTelephoneAndIdNot(req.telephone(), id)) {
            throw new ConflictException("telephone", "Ce numéro de téléphone est déjà utilisé");
        }
        copier(req, c);
        return Mapper.versDto(c);
    }

    public void supprimer(Long id) {
        Client c = trouver(id);
        if (vehicules.existsByClientId(id)) {
            throw new ConflictException("Suppression impossible : ce client possède encore des véhicules");
        }
        clients.delete(c);
    }

    Client trouver(Long id) {
        return clients.findById(id).orElseThrow(() -> NotFoundException.de("Client", id));
    }

    private void copier(ClientRequest req, Client c) {
        c.setNom(req.nom().trim());
        c.setPrenom(req.prenom().trim());
        c.setTelephone(req.telephone());
        c.setEmail(req.email() == null || req.email().isBlank() ? null : req.email().trim());
        c.setVille(req.ville() == null || req.ville().isBlank() ? null : req.ville().trim());
        c.setDateInscription(req.dateInscription());
    }
}
