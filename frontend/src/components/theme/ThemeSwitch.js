"use client";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./ThemeSwitch.module.scss";

export default function ThemeSwitch() {
  const { isDarkTheme, toggleTheme } = useTheme();

  return (
    <div className={styles.theme_switch__container}>
      <span className={styles.theme_switch__label}>Clair</span>
      <button
        className={`${styles.theme_switch__toggle} ${
          isDarkTheme ? styles["theme_switch__toggle--dark"] : ""
        }`}
        onClick={toggleTheme}
        aria-label="Toggle theme"
      />
      <span className={styles.theme_switch__label}>Sombre</span>
    </div>
  );
} 