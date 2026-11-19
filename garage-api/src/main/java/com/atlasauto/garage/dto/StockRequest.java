package com.atlasauto.garage.dto;

import com.atlasauto.garage.enums.TypeMouvement;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StockRequest(
        @NotNull(message = "Le type de mouvement est obligatoire (ENTREE ou SORTIE)")
        TypeMouvement type,

        @NotNull(message = "La quantité est obligatoire")
        @Min(value = 1, message = "La quantité doit être au moins 1")
        Integer quantite
) {
}
