package com.atlasauto.garage.dto;

import com.atlasauto.garage.enums.Carburant;
import com.atlasauto.garage.enums.StatutVehicule;
import com.atlasauto.garage.validation.AnneeValide;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Le statut est facultatif à la création (EN_ATTENTE par défaut). Sur un PUT, un changement de statut suit les transitions permises. */
public record VehiculeRequest(
        @NotBlank(message = "L'immatriculation est obligatoire")
        @Pattern(regexp = "^[A-Z]{2}-\\d{3}-[A-Z]{2}$", message = "Format attendu : AB-123-CD")
        String immatriculation,

        @NotBlank(message = "La marque est obligatoire")
        @Size(min = 2, max = 40, message = "La marque doit contenir entre 2 et 40 caractères")
        String marque,

        @NotBlank(message = "Le modèle est obligatoire")
        @Size(min = 2, max = 40, message = "Le modèle doit contenir entre 2 et 40 caractères")
        String modele,

        @NotNull(message = "L'année est obligatoire")
        @AnneeValide(message = "L'année doit être comprise entre 2000 et l'année en cours")
        Integer annee,

        @NotNull(message = "Le kilométrage est obligatoire")
        @Min(value = 0, message = "Le kilométrage ne peut pas être négatif")
        Integer kilometrage,

        @NotNull(message = "Le carburant est obligatoire")
        Carburant carburant,

        StatutVehicule statut,

        @NotNull(message = "La date d'entrée est obligatoire")
        @PastOrPresent(message = "La date d'entrée ne peut pas être dans le futur")
        LocalDate dateEntree,

        @NotNull(message = "Le coût estimé est obligatoire")
        @DecimalMin(value = "0", message = "Le coût estimé ne peut pas être négatif")
        BigDecimal coutEstime,

        @Size(max = 500, message = "La panne ne doit pas dépasser 500 caractères")
        String panne,

        @NotNull(message = "Le client est obligatoire")
        Long clientId
) {
}
