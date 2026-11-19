package com.atlasauto.garage.config;

import com.atlasauto.garage.entity.*;
import com.atlasauto.garage.enums.*;
import com.atlasauto.garage.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Données de départ, chargées dans l'ordre des dépendances (clients → véhicules → pièces → interventions → lignes).
 * Elles ne se chargent QUE si la base est vide : un redémarrage sur MySQL ne duplique rien.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    private final ClientRepository clients;
    private final VehiculeRepository vehicules;
    private final PieceRepository pieces;
    private final InterventionRepository interventions;
    private final LigneInterventionRepository lignes;

    public DataLoader(ClientRepository clients, VehiculeRepository vehicules, PieceRepository pieces,
                      InterventionRepository interventions, LigneInterventionRepository lignes) {
        this.clients = clients;
        this.vehicules = vehicules;
        this.pieces = pieces;
        this.interventions = interventions;
        this.lignes = lignes;
    }

    @Override
    public void run(String... args) {
        if (clients.count() > 0) {
            log.info("Base non vide : données de départ ignorées");
            return;
        }
        LocalDate auj = LocalDate.now();

        // 1. Clients (le dernier n'a aucun véhicule)
        Client c1 = clients.save(client("Mballa", "Jean-Paul", "677123456", "jp.mballa@mail.cm", "Yaoundé", auj.minusYears(3)));
        Client c2 = clients.save(client("Nguema", "Sandrine", "699234567", "s.nguema@mail.cm", "Douala", auj.minusYears(2)));
        Client c3 = clients.save(client("Tchouta", "Armand", "655345678", null, "Douala", auj.minusYears(1)));
        Client c4 = clients.save(client("Fotso", "Edwige", "670456789", "edwige.fotso@mail.cm", "Bafoussam", auj.minusMonths(8)));
        clients.save(client("Kamga", "Rodrigue", "690567890", null, "Douala", auj.minusMonths(1)));

        // 2. Véhicules : un de chaque statut, 4 carburants, le client 1 en possède 3
        Vehicule v1 = vehicules.save(vehicule("LT-101-AB", "Toyota", "Corolla", 2018, 85000, Carburant.ESSENCE, StatutVehicule.EN_REPARATION, auj.minusDays(3), "150000", "Freins qui sifflent", c1));
        vehicules.save(vehicule("LT-202-CD", "Toyota", "Hilux", 2020, 62000, Carburant.DIESEL, StatutVehicule.EN_ATTENTE, auj.minusDays(1), "80000", "Bruit au démarrage", c1));
        Vehicule v3 = vehicules.save(vehicule("CE-303-EF", "Peugeot", "308", 2016, 120000, Carburant.DIESEL, StatutVehicule.TERMINE, auj.minusDays(12), "95000", "Courroie à remplacer", c1));
        Vehicule v4 = vehicules.save(vehicule("CE-404-GH", "Renault", "Clio", 2019, 54000, Carburant.ESSENCE, StatutVehicule.LIVRE, auj.minusDays(35), "40000", null, c2));
        Vehicule v5 = vehicules.save(vehicule("LT-505-IJ", "Hyundai", "Tucson", 2021, 33000, Carburant.HYBRIDE, StatutVehicule.EN_REPARATION, auj.minusDays(2), "250000", "Batterie déchargée", c2));
        vehicules.save(vehicule("NO-606-KL", "Nissan", "Leaf", 2022, 21000, Carburant.ELECTRIQUE, StatutVehicule.EN_ATTENTE, auj, "120000", "Autonomie réduite", c3));
        Vehicule v7 = vehicules.save(vehicule("LT-707-MN", "Toyota", "Yaris", 2015, 143000, Carburant.ESSENCE, StatutVehicule.EN_REPARATION, auj.minusDays(1), "70000", "Vidange à faire", c3));
        Vehicule v8 = vehicules.save(vehicule("SW-808-OP", "Mercedes", "C200", 2017, 98000, Carburant.ESSENCE, StatutVehicule.LIVRE, auj.minusDays(50), "300000", "Voyant moteur", c4));

        // 3. Pièces (stock INITIAL ; il est diminué plus bas par les lignes) : 3 finiront sous leur seuil
        Piece p1 = piece("PCE-0001", "Plaquettes de frein avant", CategoriePiece.FREINAGE, "Bosch", "15000", 20, 5);
        Piece p2 = piece("PCE-0002", "Disque de frein avant", CategoriePiece.FREINAGE, "Brembo", "38000", 5, 4);
        Piece p3 = piece("PCE-0003", "Filtre à huile", CategoriePiece.ENTRETIEN, "Mann", "4500", 40, 10);
        Piece p4 = piece("PCE-0004", "Huile moteur 5W30 (5 L)", CategoriePiece.ENTRETIEN, "Total", "22000", 12, 5);
        Piece p5 = piece("PCE-0005", "Batterie 70 Ah", CategoriePiece.ELECTRICITE, "Varta", "65000", 3, 3);
        Piece p6 = piece("PCE-0006", "Amortisseur avant", CategoriePiece.SUSPENSION, "Monroe", "42000", 8, 4);
        Piece p7 = piece("PCE-0007", "Courroie de distribution", CategoriePiece.MOTEUR, "Gates", "28000", 6, 3);
        Piece p8 = piece("PCE-0008", "Bougie d'allumage", CategoriePiece.MOTEUR, "NGK", "3500", 6, 8);
        Piece p9 = piece("PCE-0009", "Fusible 20 A", CategoriePiece.ELECTRICITE, "Bosch", "500", 50, 10);
        Piece p10 = piece("PCE-0010", "Phare avant", CategoriePiece.CARROSSERIE, "Valeo", "55000", 4, 2);

        // 4. Interventions
        Intervention i1 = interventions.save(intervention(v1, TypeIntervention.FREINS, "Remplacement plaquettes et disques avant", auj.minusDays(3), null, "25000"));
        Intervention i2 = interventions.save(intervention(v3, TypeIntervention.MOTEUR, "Changement de la courroie de distribution", auj.minusDays(10), auj.minusDays(6), "60000"));
        Intervention i3 = interventions.save(intervention(v5, TypeIntervention.ELECTRICITE, "Remplacement de la batterie", auj.minusDays(2), null, "15000"));
        Intervention i4 = interventions.save(intervention(v7, TypeIntervention.VIDANGE, "Vidange et filtre à huile", auj.minusDays(1), null, "10000"));
        Intervention i5 = interventions.save(intervention(v4, TypeIntervention.VIDANGE, "Vidange complète avant livraison", auj.minusDays(35), auj.minusDays(34), "10000"));
        interventions.save(intervention(v8, TypeIntervention.DIAGNOSTIC, "Diagnostic électronique complet", auj.minusDays(50), auj.minusDays(49), "8000"));

        // 5. Lignes (10) : chaque ligne copie le prix de la pièce et diminue son stock
        ligne(i1, p1, 1);
        ligne(i1, p2, 2);
        ligne(i2, p7, 1);
        ligne(i2, p3, 1);
        ligne(i3, p5, 1);
        ligne(i3, p9, 3);
        ligne(i4, p4, 1);
        ligne(i4, p3, 1);
        ligne(i5, p4, 1);
        ligne(i5, p3, 1);

        // Les stocks ont changé : on les enregistre (p6, p8, p10 n'ont pas bougé)
        pieces.saveAll(java.util.List.of(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10));

        log.info("Données de départ chargées : {} clients, {} véhicules, {} pièces, {} interventions, {} lignes",
                clients.count(), vehicules.count(), pieces.count(), interventions.count(), lignes.count());
    }

    private Client client(String nom, String prenom, String tel, String email, String ville, LocalDate inscription) {
        Client c = new Client();
        c.setNom(nom);
        c.setPrenom(prenom);
        c.setTelephone(tel);
        c.setEmail(email);
        c.setVille(ville);
        c.setDateInscription(inscription);
        return c;
    }

    private Vehicule vehicule(String immat, String marque, String modele, int annee, int km, Carburant carburant,
                              StatutVehicule statut, LocalDate entree, String cout, String panne, Client client) {
        Vehicule v = new Vehicule();
        v.setImmatriculation(immat);
        v.setMarque(marque);
        v.setModele(modele);
        v.setAnnee(annee);
        v.setKilometrage(km);
        v.setCarburant(carburant);
        v.setStatut(statut);
        v.setDateEntree(entree);
        v.setCoutEstime(new BigDecimal(cout));
        v.setPanne(panne);
        v.setClient(client);
        return v;
    }

    /** La pièce est enregistrée tout de suite : sans cela elle n'aurait pas d'identifiant pour les lignes. */
    private Piece piece(String ref, String designation, CategoriePiece cat, String fabricant, String prix,
                        int stock, int seuil) {
        Piece p = new Piece();
        p.setReference(ref);
        p.setDesignation(designation);
        p.setCategorie(cat);
        p.setFabricant(fabricant);
        p.setPrixUnitaire(new BigDecimal(prix));
        p.setQuantiteStock(stock);
        p.setSeuilAlerte(seuil);
        p.setDateAchat(LocalDate.now().minusMonths(2));
        return pieces.save(p);
    }

    private Intervention intervention(Vehicule v, TypeIntervention type, String description, LocalDate debut,
                                      LocalDate fin, String mainOeuvre) {
        Intervention i = new Intervention();
        i.setVehicule(v);
        i.setType(type);
        i.setDescription(description);
        i.setDateDebut(debut);
        i.setDateFin(fin);
        i.setMainOeuvre(new BigDecimal(mainOeuvre));
        return i;
    }

    private void ligne(Intervention i, Piece p, int quantite) {
        LigneIntervention l = new LigneIntervention();
        l.setIntervention(i);
        l.setPiece(p);
        l.setQuantite(quantite);
        l.setPrixUnitaire(p.getPrixUnitaire());
        lignes.save(l);
        p.setQuantiteStock(p.getQuantiteStock() - quantite);
    }
}
