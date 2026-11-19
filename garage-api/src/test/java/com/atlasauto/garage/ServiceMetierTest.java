package com.atlasauto.garage;

import com.atlasauto.garage.dto.*;
import com.atlasauto.garage.dto.Statistiques.InterventionStats;
import com.atlasauto.garage.dto.Statistiques.PieceStats;
import com.atlasauto.garage.dto.Statistiques.VehiculeStats;
import com.atlasauto.garage.enums.*;
import com.atlasauto.garage.exception.ConflictException;
import com.atlasauto.garage.repository.LigneInterventionRepository;
import com.atlasauto.garage.repository.PieceRepository;
import com.atlasauto.garage.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/** Tests des règles métier. Chaque test est annulé à la fin (@Transactional) : base vide au départ, pas de données de départ. */
@SpringBootTest(properties = "app.seed.enabled=false")
@Transactional
class ServiceMetierTest {

    @Autowired ClientService clients;
    @Autowired VehiculeService vehicules;
    @Autowired PieceService pieces;
    @Autowired InterventionService interventions;
    @Autowired StatistiquesService stats;
    @Autowired PieceRepository pieceRepo;
    @Autowired LigneInterventionRepository ligneRepo;

    // ---------- petits générateurs de données ----------

    private ClientResponse client() {
        return clients.creer(new ClientRequest("Mballa", "Jean", "677000001", null, "Yaoundé", LocalDate.now()));
    }

    private VehiculeResponse vehicule(String immat, Long clientId) {
        return vehicules.creer(new VehiculeRequest(immat, "Toyota", "Corolla", 2020, 50000, Carburant.ESSENCE,
                null, LocalDate.now(), new BigDecimal("100000"), null, clientId));
    }

    private PieceResponse piece(String ref, String prix, int stock) {
        return pieces.creer(new PieceRequest(ref, "Plaquettes de frein", CategoriePiece.FREINAGE, "Bosch",
                new BigDecimal(prix), stock, 2, LocalDate.now()));
    }

    private InterventionResponse intervention(Long vehiculeId) {
        return interventions.creer(new InterventionRequest(vehiculeId, TypeIntervention.FREINS,
                "Remplacement des plaquettes", LocalDate.now(), null, new BigDecimal("10000")));
    }

    // ---------- tests ----------

    @Test
    void immatriculationEnDoublonEstRefusee() {
        ClientResponse c = client();
        vehicule("AB-123-CD", c.id());
        assertThrows(ConflictException.class, () -> vehicule("AB-123-CD", c.id()));
    }

    @Test
    void transitionDeStatutInterditeEstRefusee() {
        VehiculeResponse v = vehicule("AB-123-CD", client().id());
        assertEquals(StatutVehicule.EN_ATTENTE, v.statut());
        // EN_ATTENTE → TERMINE n'est pas permis
        assertThrows(ConflictException.class, () -> vehicules.changerStatut(v.id(), StatutVehicule.TERMINE));
        // EN_ATTENTE → EN_REPARATION l'est
        assertEquals(StatutVehicule.EN_REPARATION,
                vehicules.changerStatut(v.id(), StatutVehicule.EN_REPARATION).statut());
    }

    @Test
    void sortieDeStockSuperieureAuStockEstRefusee() {
        PieceResponse p = piece("PCE-0001", "15000", 5);
        assertThrows(ConflictException.class, () -> pieces.mouvementStock(p.id(), TypeMouvement.SORTIE, 6));
        assertEquals(5, pieces.lire(p.id()).quantiteStock());
        assertEquals(2, pieces.mouvementStock(p.id(), TypeMouvement.SORTIE, 3).quantiteStock());
        assertEquals(12, pieces.mouvementStock(p.id(), TypeMouvement.ENTREE, 10).quantiteStock());
    }

    @Test
    void statistiquesSurBaseVideRenvoientDesZeros() {
        VehiculeStats v = stats.vehicules();
        assertEquals(0, v.total());
        assertEquals(0.0, v.kilometrageMoyen());
        assertEquals(0, v.coutEstimeEnReparation().signum());
        assertEquals(0L, v.parStatut().values().stream().mapToLong(Long::longValue).sum());

        PieceStats p = stats.pieces();
        assertEquals(0, p.nombreReferences());
        assertEquals(0, p.quantiteTotale());
        assertEquals(0, p.valeurStock().signum());
        assertNull(p.pieceLaPlusChere());

        InterventionStats i = stats.interventions();
        assertEquals(0, i.nombreInterventions());
        assertEquals(0, i.coutMoyen().signum());
        assertEquals(0, i.chiffreAffairesMois().signum());
        assertTrue(i.topClients().isEmpty());
        assertTrue(i.topPieces().isEmpty());
    }

    @Test
    void statistiquesPiecesCalculentLaValeurDuStock() {
        piece("PCE-0001", "15000", 4);  // 60 000
        piece("PCE-0002", "1000", 10);  // 10 000
        PieceStats p = stats.pieces();
        assertEquals(2, p.nombreReferences());
        assertEquals(14, p.quantiteTotale());
        assertEquals(0, new BigDecimal("70000").compareTo(p.valeurStock()));
        assertEquals("PCE-0001", p.pieceLaPlusChere().reference());
    }

    @Test
    void suppressionProtegeeClientVehiculePiece() {
        ClientResponse c = client();
        VehiculeResponse v = vehicule("AB-123-CD", c.id());
        PieceResponse p = piece("PCE-0001", "15000", 10);
        InterventionResponse i = intervention(v.id());
        interventions.ajouterLigne(i.id(), new LigneRequest(p.id(), 1));

        assertThrows(ConflictException.class, () -> clients.supprimer(c.id()));     // a un véhicule
        assertThrows(ConflictException.class, () -> vehicules.supprimer(v.id()));   // a une intervention
        assertThrows(ConflictException.class, () -> pieces.supprimer(p.id()));      // utilisée dans une ligne
    }

    @Test
    void ligneTropGrandeEstRefuseeSansRienChanger() {
        PieceResponse p = piece("PCE-0001", "15000", 3);
        InterventionResponse i = intervention(vehicule("AB-123-CD", client().id()).id());

        assertThrows(ConflictException.class, () -> interventions.ajouterLigne(i.id(), new LigneRequest(p.id(), 4)));

        assertEquals(3, pieceRepo.findById(p.id()).orElseThrow().getQuantiteStock(), "le stock doit rester inchangé");
        assertEquals(0, ligneRepo.count(), "aucune ligne ne doit être créée");
    }

    @Test
    void ajoutDeLigneDiminueLeStockEtFigeLePrix() {
        PieceResponse p = piece("PCE-0001", "15000", 10);
        InterventionResponse i = intervention(vehicule("AB-123-CD", client().id()).id());

        InterventionResponse apres = interventions.ajouterLigne(i.id(), new LigneRequest(p.id(), 2));

        assertEquals(8, pieceRepo.findById(p.id()).orElseThrow().getQuantiteStock());
        assertEquals(1, apres.lignes().size());
        assertEquals(0, new BigDecimal("40000").compareTo(apres.total())); // 10 000 + 2 × 15 000

        // Le prix de la pièce change : la ligne (la « facture ») ne bouge pas
        pieces.modifier(p.id(), new PieceRequest("PCE-0001", "Plaquettes de frein", CategoriePiece.FREINAGE,
                "Bosch", new BigDecimal("99000"), 8, 2, LocalDate.now()));
        InterventionResponse relue = interventions.lire(i.id());
        assertEquals(0, new BigDecimal("15000").compareTo(relue.lignes().get(0).prixUnitaire()));
        assertEquals(0, new BigDecimal("40000").compareTo(relue.total()));
    }

    @Test
    void retirerUneLigneOuSupprimerUneInterventionRestitueLeStock() {
        PieceResponse p = piece("PCE-0001", "15000", 10);
        InterventionResponse i = intervention(vehicule("AB-123-CD", client().id()).id());

        InterventionResponse avec = interventions.ajouterLigne(i.id(), new LigneRequest(p.id(), 3));
        assertEquals(7, pieceRepo.findById(p.id()).orElseThrow().getQuantiteStock());

        interventions.retirerLigne(i.id(), avec.lignes().get(0).id());
        assertEquals(10, pieceRepo.findById(p.id()).orElseThrow().getQuantiteStock());

        interventions.ajouterLigne(i.id(), new LigneRequest(p.id(), 4));
        interventions.supprimer(i.id());
        assertEquals(10, pieceRepo.findById(p.id()).orElseThrow().getQuantiteStock());
    }

    @Test
    void interventionRefuseeSurUnVehiculeLivre() {
        VehiculeResponse v = vehicule("AB-123-CD", client().id());
        vehicules.changerStatut(v.id(), StatutVehicule.EN_REPARATION);
        vehicules.changerStatut(v.id(), StatutVehicule.TERMINE);
        vehicules.changerStatut(v.id(), StatutVehicule.LIVRE);
        assertThrows(ConflictException.class, () -> intervention(v.id()));
    }
}
