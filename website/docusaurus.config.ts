// @ts-check

import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";

const config: Config = {
  title: "Examora",
  tagline: "Online examination platform documentation",
  favicon: "img/examora.ico",
  url: "https://coding-hui.github.io",
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
    image: "img/examora.png",
    colorMode: {
      defaultMode: "light",
      disableSwitch: true,
    },
    navbar: {
      title: "Examora",
      logo: {
        src: "img/examora.png",
        alt: "Examora",
      },
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
      copyright: `© ${new Date().getFullYear()} Examora`,
      links: [
        {
          label: "GitHub",
          href: "https://github.com/coding-hui/examora",
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
