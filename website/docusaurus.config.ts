// @ts-check

import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";

const config: Config = {
  title: "Examora",
  tagline: "Online examination platform documentation",
  favicon: "img/favicon.ico",
  url: "https://examora.dev",
  baseUrl: "/",
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
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Examora",
      items: [
        {
          to: "/docs",
          position: "left",
          label: "Docs",
          activeBaseRegex: "^/docs/?$|^/docs/concepts(?:/|$)",
        },
        {
          to: "/docs/getting-started",
          position: "left",
          label: "Quick Starts",
          activeBaseRegex: "^/docs/getting-started(?:/|$)",
        },
        {
          to: "/docs/reference/api",
          position: "left",
          label: "APIs",
          activeBaseRegex: "^/docs/reference(?:/|$)",
        },
        {
          href: "https://github.com/coding-hui/examora",
          position: "right",
          label: "GitHub",
        },
      ],
    },
    footer: {
      style: "dark",
      copyright: `© ${new Date().getFullYear()} Examora`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
