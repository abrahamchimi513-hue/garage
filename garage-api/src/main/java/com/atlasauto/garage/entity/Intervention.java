package com.atlasauto.garage.entity;

import com.atlasauto.garage.enums.TypeIntervention;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "intervention")
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicule_id", nullable = false)
    private Vehicule vehicule;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeIntervention type;

    @Column(nullable = false, length = 300)
    private String description;

    @Column(nullable = false)
    private LocalDate dateDebut;

    private LocalDate dateFin;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal mainOeuvre;

    /** Miroir de lecture : la clé étrangère est portée par LigneIntervention.intervention. */
    @OneToMany(mappedBy = "intervention", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LigneIntervention> lignes = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Vehicule getVehicule() { return vehicule; }
    public void setVehicule(Vehicule vehicule) { this.vehicule = vehicule; }
    public TypeIntervention getType() { return type; }
    public void setType(TypeIntervention type) { this.type = type; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getDateDebut() { return dateDebut; }
    public void setDateDebut(LocalDate dateDebut) { this.dateDebut = dateDebut; }
    public LocalDate getDateFin() { return dateFin; }
    public void setDateFin(LocalDate dateFin) { this.dateFin = dateFin; }
    public BigDecimal getMainOeuvre() { return mainOeuvre; }
    public void setMainOeuvre(BigDecimal mainOeuvre) { this.mainOeuvre = mainOeuvre; }
    public List<LigneIntervention> getLignes() { return lignes; }
    public void setLignes(List<LigneIntervention> lignes) { this.lignes = lignes; }

    /** Total calculé (non stocké) : main-d'œuvre + somme(quantité × prix des lignes). */
    @Transient
    public BigDecimal getTotal() {
        BigDecimal pieces = lignes.stream()
                .map(LigneIntervention::getSousTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return mainOeuvre.add(pieces);
    }
}
