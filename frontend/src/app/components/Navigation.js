"use client";

import { createElement } from "react";
import styles from "../../styles/components/Navigation.module.scss";

export default function Navigation() {
  const navItems = [
    { href: "/", text: "Accueil" },
    { href: "/register", text: "Inscription" },
    { href: "/login", text: "Connexion" },
    { href: "/account", text: "Compte" },
    { href: "/species", text: "Espèces" },
    { href: "/catches", text: "Prises" },
    { href: "/teams", text: "Équipes" },
    { href: "/competitions", text: "Compétitions" },
  ];

  return createElement(
    "nav",
    {
      className: styles.nav,
    },
    createElement(
      "ul",
      {
        className: styles.nav__list,
      },
      navItems.map((item) =>
        createElement(
          "li",
          {
            key: item.href,
            className: styles.nav__item,
          },
          createElement(
            "a",
            {
              href: item.href,
              className: styles.nav__link,
            },
            item.text
          )
        )
      )
    )
  );
}
