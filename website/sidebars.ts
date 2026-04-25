// @ts-check

/**
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  docs: [
    "README",
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: ["getting-started/README"],
    },
    {
      type: "category",
      label: "Concepts",
      collapsed: false,
      items: [
        "concepts/architecture/README",
        "concepts/authentication/README",
        "concepts/exam-lifecycle/README",
        "concepts/judge-flow/README",
      ],
    },
    {
      type: "category",
      label: "Reference",
      collapsed: false,
      items: [
        "reference/api/README",
        "reference/database/README",
        "reference/desktop-client/README",
        "reference/judge-runtime/README",
      ],
    },
  ],
};

export default sidebars;
