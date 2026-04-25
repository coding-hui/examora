import React from "react";

export default function Footer(): JSX.Element | null {
  return (
    <footer
      style={{
        background: "#fff9f5",
        borderTop: "1px solid rgba(200,200,220,0.25)",
        padding: "1.5rem 0",
        textAlign: "center",
      }}
    >
      <span
        style={{
          color: "#8c8ca0",
          fontSize: "0.8rem",
          fontFamily: "inherit",
        }}
      >
        © {new Date().getFullYear()} Examora
      </span>
    </footer>
  );
}
