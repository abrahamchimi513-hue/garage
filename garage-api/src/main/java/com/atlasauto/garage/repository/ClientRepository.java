package com.atlasauto.garage.repository;

import com.atlasauto.garage.entity.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByTelephone(String telephone);

    boolean existsByTelephoneAndIdNot(String telephone, Long id);

    /** {@code motif} est déjà en minuscules et entouré de % : le texte de l'utilisateur est un paramètre, jamais concaténé. */
    @Query("""
            select c from Client c
            where lower(c.nom) like :motif or lower(c.prenom) like :motif or c.telephone like :motif
            """)
    Page<Client> rechercher(@Param("motif") String motif, Pageable pageable);
}
