package com.atlasauto.garage.exception;

import java.time.LocalDateTime;
import java.util.Map;

/** Format unique de toutes les erreurs de l'API. {@code erreurs} : champ → message (validation, doublons). */
public record ApiError(LocalDateTime horodatage, int code, String message, Map<String, String> erreurs) {

    public static ApiError of(int code, String message, Map<String, String> erreurs) {
        return new ApiError(LocalDateTime.now(), code, message, erreurs);
    }
}
