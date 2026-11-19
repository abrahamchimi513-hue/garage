package com.atlasauto.garage.repository;

import com.atlasauto.garage.entity.LigneIntervention;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LigneInterventionRepository extends JpaRepository<LigneIntervention, Long> {

    boolean existsByPieceId(Long pieceId);

    boolean existsByInterventionIdAndPieceId(Long interventionId, Long pieceId);

    /** Top des pièces les plus utilisées : jointure + GROUP BY, limité par le Pageable. */
    @Query("""
            select p.id, p.reference, p.designation, sum(l.quantite)
            from LigneIntervention l join l.piece p
            group by p.id, p.reference, p.designation
            order by sum(l.quantite) desc, p.id
            """)
    List<Object[]> topPieces(Pageable pageable);
}
