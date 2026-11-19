package com.atlasauto.garage.repository;

import com.atlasauto.garage.entity.Intervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {

    boolean existsByVehiculeId(Long vehiculeId);

    /** Intervention complète (véhicule, lignes, pièces) en une seule requête : pas de N+1. */
    @Query("""
            select distinct i from Intervention i
            join fetch i.vehicule
            left join fetch i.lignes l
            left join fetch l.piece
            where i.id = :id
            """)
    Optional<Intervention> findDetail(@Param("id") Long id);

    @Query("""
            select distinct i from Intervention i
            join fetch i.vehicule
            left join fetch i.lignes l
            left join fetch l.piece
            where i.vehicule.id = :vehiculeId
            order by i.dateDebut desc, i.id desc
            """)
    List<Intervention> findDetailParVehicule(@Param("vehiculeId") Long vehiculeId);

    // ----- Statistiques (agrégations en base) -----

    @Query("select sum(i.mainOeuvre) from Intervention i")
    BigDecimal sommeMainOeuvre();

    @Query("select sum(l.quantite * l.prixUnitaire) from LigneIntervention l")
    BigDecimal sommePieces();

    @Query("select sum(i.mainOeuvre) from Intervention i where i.dateDebut between :debut and :fin")
    BigDecimal mainOeuvrePeriode(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    @Query("""
            select sum(l.quantite * l.prixUnitaire) from LigneIntervention l
            where l.intervention.dateDebut between :debut and :fin
            """)
    BigDecimal piecesPeriode(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    /** Main-d'œuvre cumulée par client (clients ayant au moins une intervention). */
    @Query("""
            select c.id, c.prenom, c.nom, sum(i.mainOeuvre)
            from Intervention i join i.vehicule v join v.client c
            group by c.id, c.prenom, c.nom
            """)
    List<Object[]> mainOeuvreParClient();

    /** Montant des pièces cumulé par client. */
    @Query("""
            select c.id, sum(l.quantite * l.prixUnitaire)
            from LigneIntervention l join l.intervention i join i.vehicule v join v.client c
            group by c.id
            """)
    List<Object[]> piecesParClient();
}
