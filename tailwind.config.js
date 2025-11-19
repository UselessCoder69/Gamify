/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // FIX: Corrected glob patterns to properly scan for Tailwind classes in TSX files.
    // The previous pattern was incorrect and would not scan files in subdirectories.
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}