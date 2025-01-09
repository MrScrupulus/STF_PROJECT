import styles from "@/styles/LoginForm.module.css";

export default function LoginForm() {
  return (
    <form className={styles.form}>
      <input type="email" className={styles.input} placeholder="Email" />
      <input
        type="password"
        className={styles.input}
        placeholder="Mot de passe"
      />
      <button className={styles.button}>Se connecter</button>
    </form>
  );
}
