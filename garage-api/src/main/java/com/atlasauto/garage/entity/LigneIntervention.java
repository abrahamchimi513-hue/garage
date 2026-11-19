package com.atlasauto.garage.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

/** Entité d'association Intervention ↔ Pièce : elle porte la quantité et le prix figé à l'ajout. */
@Entity
@Table(name = "ligne_intervention",
        uniqueConstraints = @UniqueConstraint(name = "uk_ligne_intervention_piece",
                columnNames = {"intervention_id", "piece_id"}))
public class LigneIntervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "intervention_id", nullable = false)
    private Intervention intervention;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "piece_id", nullable = false)
    private Piece piece;

    @Column(nullable = false)
    private int quantite;

    /** Copie du prix de la pièce au moment de l'ajout, jamais modifiée ensuite. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prixUnitaire;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Intervention getIntervention() { return intervention; }
    public void setIntervention(Intervention intervention) { this.intervention = intervention; }
    public Piece getPiece() { return piece; }
    public void setPiece(Piece piece) { this.piece = piece; }
    public int getQuantite() { return quantite; }
    public void setQuantite(int quantite) { this.quantite = quantite; }
    public BigDecimal getPrixUnitaire() { return prixUnitaire; }
    public void setPrixUnitaire(BigDecimal prixUnitaire) { this.prixUnitaire = prixUnitaire; }

    @Transient
    public BigDecimal getSousTotal() {
        return prixUnitaire.multiply(BigDecimal.valueOf(quantite));
    }
}
