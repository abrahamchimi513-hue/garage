package com.atlasauto.garage.exception;

/** Ressource introuvable → 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public static NotFoundException de(String ressource, Long id) {
        return new NotFoundException(ressource + " introuvable (id " + id + ")");
    }
}
