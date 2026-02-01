import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#183c6c",
          dark: "#0f2847",
          variant: "#122d52",
          light: "#2a5490",
          surface: "#e8f0f8",
          bg: "#f4f7fb",
        },
        background: "#f0f0f0",
        surface: {
          DEFAULT: "#ffffff",
          variant: "#fafafa",
        },
        success: {
          DEFAULT: "#059669",
          light: "#d1fae5",
        },
        error: {
          DEFAULT: "#dc2626",
          light: "#fee2e2",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "#fef3c7",
        },
        info: {
          DEFAULT: "#3b82f6",
          light: "#dbeafe",
        },
        text: {
          primary: "#111827",
          secondary: "#374151",
          muted: "#6b7280",
          disabled: "#9ca3af",
        },
        border: {
          DEFAULT: "#e5e7eb",
          focus: "#183c6c",
        },
        divider: "#f3f4f6",
        sidebar: {
          bg: "#183c6c",
          text: "rgba(255, 255, 255, 0.85)",
          "text-active": "#ffffff",
          hover: "rgba(255, 255, 255, 0.1)",
          active: "rgba(255, 255, 255, 0.15)",
        },
      },
      fontFamily: {
        heading: ["Open Sans", "system-ui", "sans-serif"],
        body: ["Roboto", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)",
        primary: "0 4px 14px rgba(24, 60, 108, 0.25)",
      },
      spacing: {
        "sidebar-width": "260px",
        "header-height": "64px",
      },
    },
  },
  plugins: [],
};

export default config;