package com.atlasauto.garage.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** CORS limité à l'origine du front (jamais « * »). */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String origineAutorisee;

    public CorsConfig(@Value("${app.cors.allowed-origin}") String origineAutorisee) {
        this.origineAutorisee = origineAutorisee;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origineAutorisee)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Accept")
                .maxAge(3600);
    }
}
