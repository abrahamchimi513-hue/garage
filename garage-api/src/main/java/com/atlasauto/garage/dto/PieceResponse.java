package com.atlasauto.garage.dto;

import com.atlasauto.garage.enums.CategoriePiece;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PieceResponse(Long id, String reference, String designation, CategoriePiece categorie,
                            String fabricant, BigDecimal prixUnitaire, int quantiteStock, int seuilAlerte,
                            LocalDate dateAchat, boolean enAlerte) {
}
