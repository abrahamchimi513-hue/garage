package com.atlasauto.garage.dto;

import com.atlasauto.garage.enums.CategoriePiece;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PieceRequest(
        @NotBlank(message = "La référence est obligatoire")
        @Pattern(regexp = "^PCE-\\d{4}$", message = "Format attendu : PCE-0001")
        String reference,

        @NotBlank(message = "La désignation est obligatoire")
        @Size(min = 3, max = 80, message = "La désignation doit contenir entre 3 et 80 caractères")
        String designation,

        @NotNull(message = "La catégorie est obligatoire")
        CategoriePiece categorie,

        @NotBlank(message = "Le fabricant est obligatoire")
        String fabricant,

        @NotNull(message = "Le prix unitaire est obligatoire")
        @DecimalMin(value = "0", inclusive = false, message = "Le prix unitaire doit être supérieur à 0")
        BigDecimal prixUnitaire,

        @NotNull(message = "La quantité en stock est obligatoire")
        @Min(value = 0, message = "La quantité en stock ne peut pas être négative")
        Integer quantiteStock,

        @NotNull(message = "Le seuil d'alerte est obligatoire")
        @Min(value = 0, message = "Le seuil d'alerte ne peut pas être négatif")
        Integer seuilAlerte,

        @NotNull(message = "La date d'achat est obligatoire")
        @PastOrPresent(message = "La date d'achat ne peut pas être dans le futur")
        LocalDate dateAchat
) {
}
