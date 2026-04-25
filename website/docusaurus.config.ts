// @ts-check

import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";

const config: Config = {
  title: "Examora",
  tagline: "Online examination platform documentation",
  favicon: "img/favicon.ico",
  url: "https://examora.dev",
  baseUrl: "/examora/",
  organizationName: "examora",
  projectName: "examora",
  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "docs",
          lastVersion: "current",
          versions: {
            current: {
              label: "v0.1",
            },
          },
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      },
    ],
  ],

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    colorMode: {
      defaultMode: "light",
      disableSwitch: true,
    },
    navbar: {
      title: "Examora",
      items: [
        {
          to: "/examora/docs",
          position: "left",
          label: "Docs",
          activeBaseRegex: "^/examora/docs/?$|^/examora/docs/concepts(?:/|$)",
        },
        {
          to: "/examora/docs/getting-started",
          position: "left",
          label: "Quick Starts",
          activeBaseRegex: "^/examora/docs/getting-started(?:/|$)",
        },
        {
          to: "/examora/docs/reference/api",
          position: "left",
          label: "APIs",
          activeBaseRegex: "^/examora/docs/reference(?:/|$)",
        },
        {
          href: "https://github.com/coding-hui/examora",
          position: "right",
          label: "GitHub",
        },
      ],
    },
    footer: {
      style: "light",
      copyright: `© ${new Date().getFullYear()} Examora`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
