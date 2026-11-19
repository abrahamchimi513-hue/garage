package com.atlasauto.garage.service;

import com.atlasauto.garage.dto.*;
import com.atlasauto.garage.entity.Client;
import com.atlasauto.garage.entity.Vehicule;
import com.atlasauto.garage.enums.StatutVehicule;
import com.atlasauto.garage.exception.ConflictException;
import com.atlasauto.garage.exception.NotFoundException;
import com.atlasauto.garage.repository.ClientRepository;
import com.atlasauto.garage.repository.InterventionRepository;
import com.atlasauto.garage.repository.VehiculeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class VehiculeService {

    private final VehiculeRepository vehicules;
    private final ClientRepository clients;
    private final InterventionRepository interventions;

    public VehiculeService(VehiculeRepository vehicules, ClientRepository clients,
                           InterventionRepository interventions) {
        this.vehicules = vehicules;
        this.clients = clients;
        this.interventions = interventions;
    }

    @Transactional(readOnly = true)
    public PageResponse<VehiculeResponse> lister(String recherche, StatutVehicule statut, Long clientId,
                                                 int page, int taille) {
        return PageResponse.de(
                vehicules.rechercher(Recherche.motif(recherche), statut, clientId, Recherche.page(page, taille))
                        .map(Mapper::versDto));
    }

    @Transactional(readOnly = true)
    public VehiculeResponse lire(Long id) {
        return Mapper.versDto(trouver(id));
    }

    public VehiculeResponse creer(VehiculeRequest req) {
        if (vehicules.existsByImmatriculation(req.immatriculation())) {
            throw new ConflictException("immatriculation", "Cette immatriculation existe déjà");
        }
        Client client = clients.findById(req.clientId())
                .orElseThrow(() -> NotFoundException.de("Client", req.clientId()));
        Vehicule v = new Vehicule();
        copier(req, v, client);
        v.setStatut(req.statut() == null ? StatutVehicule.EN_ATTENTE : req.statut());
        return Mapper.versDto(vehicules.save(v));
    }

    public VehiculeResponse modifier(Long id, VehiculeRequest req) {
        Vehicule v = trouver(id);
        if (vehicules.existsByImmatriculationAndIdNot(req.immatriculation(), id)) {
            throw new ConflictException("immatriculation", "Cette immatriculation existe déjà");
        }
        Client client = clients.findById(req.clientId())
                .orElseThrow(() -> NotFoundException.de("Client", req.clientId()));
        if (req.statut() != null && req.statut() != v.getStatut()) {
            verifierTransition(v.getStatut(), req.statut());
            v.setStatut(req.statut());
        }
        copier(req, v, client);
        return Mapper.versDto(v);
    }

    public VehiculeResponse changerStatut(Long id, StatutVehicule cible) {
        Vehicule v = trouver(id);
        verifierTransition(v.getStatut(), cible);
        v.setStatut(cible);
        return Mapper.versDto(v);
    }

    public void supprimer(Long id) {
        Vehicule v = trouver(id);
        if (interventions.existsByVehiculeId(id)) {
            throw new ConflictException("Suppression impossible : ce véhicule a des interventions");
        }
        vehicules.delete(v);
    }

    Vehicule trouver(Long id) {
        return vehicules.findAvecClient(id).orElseThrow(() -> NotFoundException.de("Véhicule", id));
    }

    private void verifierTransition(StatutVehicule actuel, StatutVehicule cible) {
        if (!actuel.peutPasserA(cible)) {
            throw new ConflictException("statut", "Transition interdite : " + actuel + " → " + cible);
        }
    }

    private void copier(VehiculeRequest req, Vehicule v, Client client) {
        v.setImmatriculation(req.immatriculation());
        v.setMarque(req.marque().trim());
        v.setModele(req.modele().trim());
        v.setAnnee(req.annee());
        v.setKilometrage(req.kilometrage());
        v.setCarburant(req.carburant());
        v.setDateEntree(req.dateEntree());
        v.setCoutEstime(req.coutEstime());
        v.setPanne(req.panne() == null || req.panne().isBlank() ? null : req.panne().trim());
        v.setClient(client);
    }
}
