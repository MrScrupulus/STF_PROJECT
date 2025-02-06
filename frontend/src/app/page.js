"use client";

import { createElement } from "react";
import styles from "@/styles/pages/home.module.scss";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className={styles.home}>
      <div className={styles.home__content}>
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
      <h1 className={styles.home__title}>Street Fishing</h1>
      <p className={styles.home__subtitle}>Bienvenue sur STF Project</p>
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
    </div>
  );
}
