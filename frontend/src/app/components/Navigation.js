"use client";

import { createElement } from "react";

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

  return createElement("nav", {
    className: "bg-gray-800 text-white p-4",
    children: createElement("ul", {
      className: "flex space-x-4",
      children: navItems.map((item) =>
        createElement("li", {
          key: item.href,
          children: createElement("a", {
            href: item.href,
            className: "hover:text-gray-300",
            children: item.text,
          }),
        })
      ),
    }),
  });
}
