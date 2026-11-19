package com.atlasauto.garage.dto;

import com.atlasauto.garage.enums.TypeIntervention;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InterventionResponse(Long id, Long vehiculeId, TypeIntervention type, String description,
                                   LocalDate dateDebut, LocalDate dateFin, BigDecimal mainOeuvre,
                                   List<LigneResponse> lignes, BigDecimal total) {
}
