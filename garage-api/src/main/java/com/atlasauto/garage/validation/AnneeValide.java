package com.atlasauto.garage.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/** Année comprise entre {@code min} (2000 par défaut) et l'année en cours (calculée, pas écrite en dur). */
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = AnneeValideValidator.class)
public @interface AnneeValide {
    String message() default "L'année doit être comprise entre {min} et l'année en cours";
    int min() default 2000;
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
