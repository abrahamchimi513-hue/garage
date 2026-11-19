package com.atlasauto.garage.dto;

import com.atlasauto.garage.enums.StatutVehicule;
import jakarta.validation.constraints.NotNull;

public record StatutRequest(@NotNull(message = "Le statut est obligatoire") StatutVehicule statut) {
}
