package com.atlasauto.garage.entity;

import com.atlasauto.garage.enums.Carburant;
import com.atlasauto.garage.enums.StatutVehicule;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vehicule")
public class Vehicule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String immatriculation;

    @Column(nullable = false, length = 40)
    private String marque;

    @Column(nullable = false, length = 40)
    private String modele;

    @Column(nullable = false)
    private int annee;

    @Column(nullable = false)
    private int kilometrage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Carburant carburant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutVehicule statut;

    @Column(nullable = false)
    private LocalDate dateEntree;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal coutEstime;

    @Column(length = 500)
    private String panne;

    /** Côté propriétaire de la clé étrangère client_id. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getImmatriculation() { return immatriculation; }
    public void setImmatriculation(String immatriculation) { this.immatriculation = immatriculation; }
    public String getMarque() { return marque; }
    public void setMarque(String marque) { this.marque = marque; }
    public String getModele() { return modele; }
    public void setModele(String modele) { this.modele = modele; }
    public int getAnnee() { return annee; }
    public void setAnnee(int annee) { this.annee = annee; }
    public int getKilometrage() { return kilometrage; }
    public void setKilometrage(int kilometrage) { this.kilometrage = kilometrage; }
    public Carburant getCarburant() { return carburant; }
    public void setCarburant(Carburant carburant) { this.carburant = carburant; }
    public StatutVehicule getStatut() { return statut; }
    public void setStatut(StatutVehicule statut) { this.statut = statut; }
    public LocalDate getDateEntree() { return dateEntree; }
    public void setDateEntree(LocalDate dateEntree) { this.dateEntree = dateEntree; }
    public BigDecimal getCoutEstime() { return coutEstime; }
    public void setCoutEstime(BigDecimal coutEstime) { this.coutEstime = coutEstime; }
    public String getPanne() { return panne; }
    public void setPanne(String panne) { this.panne = panne; }
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }
}
