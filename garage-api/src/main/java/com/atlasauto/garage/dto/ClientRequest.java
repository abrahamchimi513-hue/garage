package com.atlasauto.garage.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record ClientRequest(
        @NotBlank(message = "Le nom est obligatoire")
        @Size(min = 2, max = 60, message = "Le nom doit contenir entre 2 et 60 caractères")
        String nom,

        @NotBlank(message = "Le prénom est obligatoire")
        @Size(min = 2, max = 60, message = "Le prénom doit contenir entre 2 et 60 caractères")
        String prenom,

        @NotBlank(message = "Le téléphone est obligatoire")
        @Pattern(regexp = "^6\\d{8}$", message = "Le téléphone doit contenir 9 chiffres et commencer par 6")
        String telephone,

        @Email(message = "Le format de l'e-mail est invalide")
        String email,

        @Size(max = 60, message = "La ville ne doit pas dépasser 60 caractères")
        String ville,

        @NotNull(message = "La date d'inscription est obligatoire")
        @PastOrPresent(message = "La date d'inscription ne peut pas être dans le futur")
        LocalDate dateInscription
) {
}
