package com.atlasauto.garage.exception;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<ApiError> reponse(HttpStatus statut, String message, Map<String, String> erreurs) {
        return ResponseEntity.status(statut).body(ApiError.of(statut.value(), message, erreurs));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        Map<String, String> erreurs = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> erreurs.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return reponse(HttpStatus.BAD_REQUEST, "Les données envoyées sont invalides", erreurs);
    }

    @ExceptionHandler({ConstraintViolationException.class, HandlerMethodValidationException.class})
    public ResponseEntity<ApiError> parametresInvalides(Exception ex) {
        return reponse(HttpStatus.BAD_REQUEST, "Paramètre invalide", Map.of());
    }

    @ExceptionHandler(DonneesInvalidesException.class)
    public ResponseEntity<ApiError> donneesInvalides(DonneesInvalidesException ex) {
        return reponse(HttpStatus.BAD_REQUEST, "Les données envoyées sont invalides", ex.getErreurs());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> corpsIllisible(HttpMessageNotReadableException ex) {
        return reponse(HttpStatus.BAD_REQUEST,
                "Corps de la requête illisible ou valeur inconnue (date, nombre ou énumération)", Map.of());
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ApiError> parametreIncorrect(Exception ex) {
        return reponse(HttpStatus.BAD_REQUEST, "Paramètre de requête manquant ou de mauvais type", Map.of());
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> introuvable(NotFoundException ex) {
        return reponse(HttpStatus.NOT_FOUND, ex.getMessage(), Map.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> routeInconnue(NoResourceFoundException ex) {
        return reponse(HttpStatus.NOT_FOUND, "Adresse inconnue", Map.of());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> conflit(ConflictException ex) {
        return reponse(HttpStatus.CONFLICT, ex.getMessage(), ex.getErreurs());
    }

    /** Filet de sécurité : une contrainte unique ou une clé étrangère violée en base (ex. deux requêtes simultanées). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> integrite(DataIntegrityViolationException ex) {
        log.warn("Violation d'intégrité : {}", ex.getMostSpecificCause().getMessage());
        return reponse(HttpStatus.CONFLICT, "L'opération est en conflit avec les données existantes", Map.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> methodeNonSupportee(HttpRequestMethodNotSupportedException ex) {
        return reponse(HttpStatus.METHOD_NOT_ALLOWED, "Méthode HTTP non supportée sur cette adresse", Map.of());
    }

    /** Dernier recours : la trace reste dans les journaux du serveur, jamais dans la réponse. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> inattendue(Exception ex) {
        log.error("Erreur inattendue", ex);
        return reponse(HttpStatus.INTERNAL_SERVER_ERROR, "Une erreur interne est survenue", Map.of());
    }
}
