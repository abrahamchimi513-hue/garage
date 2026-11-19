package com.atlasauto.garage.dto;

import com.atlasauto.garage.enums.Carburant;
import com.atlasauto.garage.enums.StatutVehicule;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VehiculeResponse(Long id, String immatriculation, String marque, String modele, int annee,
                               int kilometrage, Carburant carburant, StatutVehicule statut, LocalDate dateEntree,
                               BigDecimal coutEstime, String panne, Long clientId, String clientNom) {
}
