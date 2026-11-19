package com.atlasauto.garage.exception;

import java.util.Map;

/** Règle de validation qui dépend de plusieurs champs (ex. date de fin avant date de début) → 400. */
public class DonneesInvalidesException extends RuntimeException {

    private final transient Map<String, String> erreurs;

    public DonneesInvalidesException(String champ, String message) {
        super(message);
        this.erreurs = Map.of(champ, message);
    }

    public Map<String, String> getErreurs() {
        return erreurs;
    }
}
