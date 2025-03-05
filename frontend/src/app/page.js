"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/pages/home.module.scss";
import Image from "next/image";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.home}>
      <p className={styles.home__subtitle}>Bienvenue sur STF Project</p>

      {/* Logos qui apparaissent au scroll */}
      <div
        className={`${styles.home__logos} ${isScrolled ? styles.visible : ""}`}
      >
        <div className={styles.home__logo_container}>
          <Image
            src="/images/logos/logo_street_neg.png"
            alt="Street Fishing Logo"
            width={360}
            height={180}
            style={{
              width: "360px",
              height: "180px",
              objectFit: "contain",
            }}
            priority
          />
        </div>
        <div className={styles.home__welcome_container}>
          <p className={styles.home__welcome_text}>Événement organisé par</p>
          <Image
            src="/images/logos/LogoMEPN_TransH.png"
            alt="MEPN Logo"
            width={110}
            height={55}
            style={{
              width: "110px",
              height: "55px",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      <section className={styles.home__section}>
        <h2 className={styles.home__sectionTitle}>À quoi ça sert?</h2>
        <div className={styles.home__features}>
          {[
            {
              title: "Compétitions",
              description:
                "Inscrivez-vous à une compétition, suivez vos résultats en direct",
            },
            {
              title: "Équipes",
              description: "Créez votre équipe, invitez vos amis.",
            },
            {
              title: "Prises",
              description: "Enregistrez et validez les prises des pêcheurs",
            },
          ].map((feature) => (
            <div key={feature.title} className={styles.home__feature}>
              <h3 className={styles.home__featureTitle}>{feature.title}</h3>
              <p className={styles.home__featureDescription}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.home__section}>
        <h2 className={styles.home__sectionTitle}>Où nous trouver ?</h2>
        <div className={styles.home__location}>
          <div className={styles.home__address}>
            <h3>Maison de l'eau, de la pêche et de la nature</h3>
            <p>202 Grande Rue</p>
            <p>59100 Roubaix</p>
          </div>
          <div className={styles.home__map}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2525.5986557674164!2d3.1663663!3d50.6901099!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c32899fdd0629d%3A0x1a810415c27321dd!2s202%20Grande%20Rue%2C%2059100%20Roubaix!5e0!3m2!1sfr!2sfr!4v1710835940045!5m2!1sfr!2sfr"
              width="600"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}
