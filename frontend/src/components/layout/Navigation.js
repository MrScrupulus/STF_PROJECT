import styles from "@/styles/components/layout/Navigation.module.scss"; 

<nav className={styles.Header__nav}>
  <ul className={styles.Header__menu}>
    {filteredMenuItems.map((item) => (
      <li key={item.path} className={styles["Header__menu-item"]}>
        <Link href={item.path} className={styles["Header__menu-link"]}>
          {item.label}
        </Link>
      </li>
    ))}
  </ul>
</nav> 