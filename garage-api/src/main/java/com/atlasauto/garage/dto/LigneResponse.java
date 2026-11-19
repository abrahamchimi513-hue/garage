package com.atlasauto.garage.dto;

import java.math.BigDecimal;

public record LigneResponse(Long id, Long pieceId, String pieceReference, String pieceDesignation,
                            int quantite, BigDecimal prixUnitaire, BigDecimal sousTotal) {
}
