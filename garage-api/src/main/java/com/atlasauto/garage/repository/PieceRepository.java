package com.atlasauto.garage.repository;

import com.atlasauto.garage.entity.Piece;
import com.atlasauto.garage.enums.CategoriePiece;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PieceRepository extends JpaRepository<Piece, Long> {

    boolean existsByReference(String reference);

    boolean existsByReferenceAndIdNot(String reference, Long id);

    @Query("""
            select p from Piece p
            where (lower(p.reference) like :motif or lower(p.designation) like :motif)
              and (:categorie is null or p.categorie = :categorie)
            """)
    Page<Piece> rechercher(@Param("motif") String motif, @Param("categorie") CategoriePiece categorie,
                           Pageable pageable);

    /** Verrou en écriture : deux mouvements de stock simultanés ne s'écrasent pas. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Piece p where p.id = :id")
    Optional<Piece> findByIdPourMiseAJour(@Param("id") Long id);

    @Query("select p from Piece p where p.quantiteStock <= p.seuilAlerte order by p.quantiteStock, p.id")
    List<Piece> findEnAlerte();

    // ----- Statistiques (agrégations en base) -----

    @Query("select count(p) from Piece p where p.quantiteStock <= p.seuilAlerte")
    long compterEnAlerte();

    @Query("select sum(p.quantiteStock) from Piece p")
    Long quantiteTotale();

    @Query("select sum(p.prixUnitaire * p.quantiteStock) from Piece p")
    BigDecimal valeurTotaleStock();

    @Query("select p.categorie, count(p), sum(p.prixUnitaire * p.quantiteStock) from Piece p group by p.categorie")
    List<Object[]> statsParCategorie();

    Optional<Piece> findFirstByOrderByPrixUnitaireDescIdAsc();
}
