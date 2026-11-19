package com.atlasauto.garage.dto;

import java.time.LocalDate;

public record ClientResponse(Long id, String nom, String prenom, String telephone, String email,
                             String ville, LocalDate dateInscription) {
}
