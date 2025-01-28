"use client";
import { TeamList } from "@/components/teams/TeamList";
import styles from "@/styles/pages/teams.module.scss";
import Link from "next/link";

export default function TeamsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mes Équipes</h1>
        <Link href="/teams/create" className={styles.createButton}>
          Créer une équipe
        </Link>
      </div>
      <TeamList />
    </div>
  );
}
