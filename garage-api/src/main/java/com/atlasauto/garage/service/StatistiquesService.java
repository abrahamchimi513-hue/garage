package com.atlasauto.garage.service;

import com.atlasauto.garage.dto.Statistiques.*;
import com.atlasauto.garage.enums.Carburant;
import com.atlasauto.garage.enums.StatutVehicule;
import com.atlasauto.garage.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/** Tous les chiffres viennent de requêtes d'agrégation (COUNT, SUM, AVG, GROUP BY) : jamais de boucle sur toute une table. */
@Service
@Transactional(readOnly = true)
public class StatistiquesService {

    private static final int TOP = 5;

    private final VehiculeRepository vehicules;
    private final PieceRepository pieces;
    private final ClientRepository clients;
    private final InterventionRepository interventions;
    private final LigneInterventionRepository lignes;

    public StatistiquesService(VehiculeRepository vehicules, PieceRepository pieces, ClientRepository clients,
                               InterventionRepository interventions, LigneInterventionRepository lignes) {
        this.vehicules = vehicules;
        this.pieces = pieces;
        this.clients = clients;
        this.interventions = interventions;
        this.lignes = lignes;
    }

    public VehiculeStats vehicules() {
        // Toutes les valeurs de l'enum sont présentes, même à 0 : la somme des statuts égale toujours le total.
        Map<String, Long> parStatut = new LinkedHashMap<>();
        for (StatutVehicule s : StatutVehicule.values()) parStatut.put(s.name(), 0L);
        for (Object[] r : vehicules.compterParStatut()) parStatut.put(((Enum<?>) r[0]).name(), ((Number) r[1]).longValue());

        Map<String, Long> parCarburant = new LinkedHashMap<>();
        for (Carburant c : Carburant.values()) parCarburant.put(c.name(), 0L);
        for (Object[] r : vehicules.compterParCarburant()) parCarburant.put(((Enum<?>) r[0]).name(), ((Number) r[1]).longValue());

        List<Compteur> topMarques = vehicules.topMarques(PageRequest.of(0, TOP)).stream()
                .map(r -> new Compteur((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        LocalDate debut = LocalDate.now().withDayOfMonth(1);
        LocalDate fin = debut.plusMonths(1).minusDays(1);

        Double km = vehicules.kilometrageMoyen();
        return new VehiculeStats(
                vehicules.count(),
                parStatut,
                parCarburant,
                topMarques,
                km == null ? 0 : Math.round(km * 100.0) / 100.0,
                zero(vehicules.sommeCoutEstime(StatutVehicule.EN_REPARATION)),
                vehicules.countByDateEntreeBetween(debut, fin));
    }

    public PieceStats pieces() {
        List<CategorieStat> parCategorie = pieces.statsParCategorie().stream()
                .map(r -> new CategorieStat(((Enum<?>) r[0]).name(), ((Number) r[1]).longValue(), zero((BigDecimal) r[2])))
                .toList();
        Long quantite = pieces.quantiteTotale();
        return new PieceStats(
                pieces.count(),
                quantite == null ? 0 : quantite,
                zero(pieces.valeurTotaleStock()),
                pieces.compterEnAlerte(),
                parCategorie,
                pieces.findFirstByOrderByPrixUnitaireDescIdAsc().map(Mapper::versDto).orElse(null));
    }

    public InterventionStats interventions() {
        long nombre = interventions.count();

        LocalDate debut = LocalDate.now().withDayOfMonth(1);
        LocalDate fin = debut.plusMonths(1).minusDays(1);
        BigDecimal caMois = zero(interventions.mainOeuvrePeriode(debut, fin))
                .add(zero(interventions.piecesPeriode(debut, fin)));

        BigDecimal totalGlobal = zero(interventions.sommeMainOeuvre()).add(zero(interventions.sommePieces()));
        BigDecimal coutMoyen = nombre == 0
                ? BigDecimal.ZERO
                : totalGlobal.divide(BigDecimal.valueOf(nombre), 2, RoundingMode.HALF_UP);

        List<PieceTop> topPieces = lignes.topPieces(PageRequest.of(0, TOP)).stream()
                .map(r -> new PieceTop((Long) r[0], (String) r[1], (String) r[2], ((Number) r[3]).longValue()))
                .toList();

        return new InterventionStats(clients.count(), nombre, caMois, coutMoyen, topClients(), topPieces,
                vehicules.compterSansIntervention());
    }

    /** Montant dépensé par client = main-d'œuvre (une requête groupée) + pièces (une requête groupée). */
    private List<ClientTop> topClients() {
        Map<Long, BigDecimal> pieces = new HashMap<>();
        for (Object[] r : interventions.piecesParClient()) {
            pieces.put((Long) r[0], zero((BigDecimal) r[1]));
        }
        List<ClientTop> tous = new ArrayList<>();
        for (Object[] r : interventions.mainOeuvreParClient()) {
            Long id = (Long) r[0];
            BigDecimal montant = zero((BigDecimal) r[3]).add(pieces.getOrDefault(id, BigDecimal.ZERO));
            tous.add(new ClientTop(id, r[1] + " " + r[2], montant));
        }
        tous.sort(Comparator.comparing(ClientTop::montant).reversed().thenComparing(ClientTop::clientId));
        return tous.stream().limit(TOP).toList();
    }

    private static BigDecimal zero(BigDecimal valeur) {
        return valeur == null ? BigDecimal.ZERO : valeur;
    }
}
