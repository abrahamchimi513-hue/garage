package com.atlasauto.garage;

import com.atlasauto.garage.dto.ClientRequest;
import com.atlasauto.garage.dto.ClientResponse;
import com.atlasauto.garage.dto.VehiculeRequest;
import com.atlasauto.garage.enums.Carburant;
import com.atlasauto.garage.service.ClientService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Tests des codes HTTP et du format d'erreur uniforme. */
@SpringBootTest(properties = "app.seed.enabled=false")
@AutoConfigureMockMvc
@Transactional
class ApiTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ClientService clients;

    private Long clientId() {
        ClientResponse c = clients.creer(new ClientRequest("Mballa", "Jean", "677000001", null, "Yaoundé",
                LocalDate.now()));
        return c.id();
    }

    private String vehiculeJson(String immat, Long clientId) throws Exception {
        return json.writeValueAsString(new VehiculeRequest(immat, "Toyota", "Corolla", 2020, 50000,
                Carburant.ESSENCE, null, LocalDate.now(), new BigDecimal("100000"), null, clientId));
    }

    @Test
    void creationRenvoie201AvecLeNomDuProprietaire() throws Exception {
        Long cid = clientId();
        mvc.perform(post("/api/vehicules").contentType(MediaType.APPLICATION_JSON).content(vehiculeJson("AB-123-CD", cid)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.clientId").value(cid))
                .andExpect(jsonPath("$.clientNom").value("Jean Mballa"))
                .andExpect(jsonPath("$.client").doesNotExist()); // jamais l'entité, jamais le client entier
    }

    @Test
    void donneesInvalidesRenvoient400ParChamp() throws Exception {
        String corps = json.writeValueAsString(Map.of("immatriculation", "ab123cd", "annee", 1999));
        mvc.perform(post("/api/vehicules").contentType(MediaType.APPLICATION_JSON).content(corps))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.horodatage").exists())
                .andExpect(jsonPath("$.erreurs.immatriculation").value("Format attendu : AB-123-CD"))
                .andExpect(jsonPath("$.erreurs.annee").exists())
                .andExpect(jsonPath("$.erreurs.clientId").exists());
    }

    @Test
    void ressourceInconnueRenvoie404AuFormatUniforme() throws Exception {
        mvc.perform(get("/api/vehicules/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.horodatage").exists());
    }

    @Test
    void clientInexistantRenvoie404() throws Exception {
        mvc.perform(post("/api/vehicules").contentType(MediaType.APPLICATION_JSON).content(vehiculeJson("AB-123-CD", 9999L)))
                .andExpect(status().isNotFound());
    }

    @Test
    void doublonRenvoie409AvecLeChampFautif() throws Exception {
        Long cid = clientId();
        mvc.perform(post("/api/vehicules").contentType(MediaType.APPLICATION_JSON).content(vehiculeJson("AB-123-CD", cid)))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/vehicules").contentType(MediaType.APPLICATION_JSON).content(vehiculeJson("AB-123-CD", cid)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(409))
                .andExpect(jsonPath("$.erreurs.immatriculation").exists());
    }

    @Test
    void suppressionRenvoie204PuisLaListeEstPaginee() throws Exception {
        Long cid = clientId();
        String reponse = mvc.perform(post("/api/vehicules").contentType(MediaType.APPLICATION_JSON)
                        .content(vehiculeJson("AB-123-CD", cid)))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(reponse).get("id").asLong();

        mvc.perform(get("/api/vehicules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.contenu.length()").value(1));

        mvc.perform(delete("/api/vehicules/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/vehicules/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void pingEtStatistiquesRepondent() throws Exception {
        mvc.perform(get("/api/ping")).andExpect(status().isOk()).andExpect(jsonPath("$.message").exists());
        mvc.perform(get("/api/vehicules/statistiques")).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/pieces/statistiques")).andExpect(status().isOk()).andExpect(jsonPath("$.nombreReferences").value(0));
        mvc.perform(get("/api/interventions/statistiques")).andExpect(status().isOk()).andExpect(jsonPath("$.nombreInterventions").value(0));
    }
}
