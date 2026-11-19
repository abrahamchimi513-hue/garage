package com.atlasauto.garage.dto;

import com.atlasauto.garage.enums.TypeIntervention;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InterventionRequest(
        @NotNull(message = "Le véhicule est obligatoire")
        Long vehiculeId,

        @NotNull(message = "Le type d'intervention est obligatoire")
        TypeIntervention type,

        @NotBlank(message = "La description est obligatoire")
        @Size(min = 5, max = 300, message = "La description doit contenir entre 5 et 300 caractères")
        String description,

        @NotNull(message = "La date de début est obligatoire")
        @PastOrPresent(message = "La date de début ne peut pas être dans le futur")
        LocalDate dateDebut,

        LocalDate dateFin,

        @NotNull(message = "La main-d'œuvre est obligatoire")
        @DecimalMin(value = "0", message = "La main-d'œuvre ne peut pas être négative")
        BigDecimal mainOeuvre
) {
}
