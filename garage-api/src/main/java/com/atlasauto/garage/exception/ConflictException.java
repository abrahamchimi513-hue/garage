package com.atlasauto.garage.exception;

import java.util.Map;

/** Demande correcte mais en conflit avec l'état actuel (doublon, transition interdite, élément utilisé…) → 409. */
public class ConflictException extends RuntimeException {

    private final transient Map<String, String> erreurs;

    public ConflictException(String message) {
        this(message, Map.of());
    }

    /** Version avec un champ fautif, pour que le front affiche le message sous le bon champ. */
    public ConflictException(String champ, String message) {
        this(message, Map.of(champ, message));
    }

    private ConflictException(String message, Map<String, String> erreurs) {
        super(message);
        this.erreurs = erreurs;
    }

    public Map<String, String> getErreurs() {
        return erreurs;
    }
}
