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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
      },
      height: {
        'hero-main': 'calc(100vh - 160px)',
        'nav': '60px',
        'hero-banner': '100px',
      },
    },
    fontFamily: {
      "subheading": ["Ubuntu Sans", "sans-serif"],
    }
  },
  plugins: [],
};
export default config;
