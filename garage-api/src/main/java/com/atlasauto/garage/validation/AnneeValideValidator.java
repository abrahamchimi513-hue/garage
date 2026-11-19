package com.atlasauto.garage.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.Year;

public class AnneeValideValidator implements ConstraintValidator<AnneeValide, Integer> {

    private int min;

    @Override
    public void initialize(AnneeValide annotation) {
        this.min = annotation.min();
    }

    @Override
    public boolean isValid(Integer annee, ConstraintValidatorContext context) {
        if (annee == null) {
            return true; // @NotNull s'en occupe
        }
        return annee >= min && annee <= Year.now().getValue();
    }
}
