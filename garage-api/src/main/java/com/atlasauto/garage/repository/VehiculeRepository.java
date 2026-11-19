package com.atlasauto.garage.repository;

import com.atlasauto.garage.entity.Vehicule;
import com.atlasauto.garage.enums.StatutVehicule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {

    boolean existsByImmatriculation(String immatriculation);

    boolean existsByImmatriculationAndIdNot(String immatriculation, Long id);

    boolean existsByClientId(Long clientId);

    /** JOIN FETCH du propriétaire : évite le problème N+1 quand la liste affiche le nom du client. */
    @Query(value = """
            select v from Vehicule v join fetch v.client
            where (lower(v.marque) like :motif or lower(v.modele) like :motif or lower(v.immatriculation) like :motif)
              and (:statut is null or v.statut = :statut)
              and (:clientId is null or v.client.id = :clientId)
            """,
            countQuery = """
                    select count(v) from Vehicule v
                    where (lower(v.marque) like :motif or lower(v.modele) like :motif or lower(v.immatriculation) like :motif)
                      and (:statut is null or v.statut = :statut)
                      and (:clientId is null or v.client.id = :clientId)
                    """)
    Page<Vehicule> rechercher(@Param("motif") String motif, @Param("statut") StatutVehicule statut,
                              @Param("clientId") Long clientId, Pageable pageable);

    @Query("select v from Vehicule v join fetch v.client where v.id = :id")
    Optional<Vehicule> findAvecClient(@Param("id") Long id);

    @Query("select v from Vehicule v join fetch v.client where v.client.id = :clientId order by v.id")
    List<Vehicule> findByClientIdAvecClient(@Param("clientId") Long clientId);

    // ----- Statistiques (agrégations en base) -----

    @Query("select v.statut, count(v) from Vehicule v group by v.statut")
    List<Object[]> compterParStatut();

    @Query("select v.carburant, count(v) from Vehicule v group by v.carburant")
    List<Object[]> compterParCarburant();

    @Query("select v.marque, count(v) from Vehicule v group by v.marque order by count(v) desc, v.marque")
    List<Object[]> topMarques(Pageable pageable);

    /** Null si la table est vide : le service met 0. */
    @Query("select avg(v.kilometrage) from Vehicule v")
    Double kilometrageMoyen();

    @Query("select sum(v.coutEstime) from Vehicule v where v.statut = :statut")
    BigDecimal sommeCoutEstime(@Param("statut") StatutVehicule statut);

    long countByDateEntreeBetween(LocalDate debut, LocalDate fin);

    @Query("select count(v) from Vehicule v where not exists (select 1 from Intervention i where i.vehicule = v)")
    long compterSansIntervention();
}
