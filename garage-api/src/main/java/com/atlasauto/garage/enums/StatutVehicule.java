package com.atlasauto.garage.enums;

import java.util.EnumSet;
import java.util.Set;

public enum StatutVehicule {
    EN_ATTENTE, EN_REPARATION, TERMINE, LIVRE;

    /** Transitions permises : EN_ATTENTE → EN_REPARATION → TERMINE → LIVRE, et TERMINE → EN_REPARATION. */
    public Set<StatutVehicule> transitionsPermises() {
        return switch (this) {
            case EN_ATTENTE -> EnumSet.of(EN_REPARATION);
            case EN_REPARATION -> EnumSet.of(TERMINE);
            case TERMINE -> EnumSet.of(LIVRE, EN_REPARATION);
            case LIVRE -> EnumSet.noneOf(StatutVehicule.class);
        };
    }

    public boolean peutPasserA(StatutVehicule cible) {
        return transitionsPermises().contains(cible);
    }
}
