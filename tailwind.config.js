/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Apple SD Gothic Neo"', '"Noto Sans KR"', '"Malgun Gothic"', 'sans-serif'],
      },
      colors: {
        // 로옥션 브랜드 파랑과 회색 단계 (홈 시안 2026-11-10)
        brand: { 50: '#EEF3FF', 100: '#E4EBFF', 200: '#C9D6FF', 500: '#2B5CFF', 600: '#1E44C8' },
        ink: { DEFAULT: '#191F28', 700: '#333D4B', 600: '#4E5968', 500: '#5F6875', 400: '#6B7684' },
        surface: { DEFAULT: '#F2F4F6', soft: '#F7F8FA', line: '#EEF0F3' },
      },
      animation: {
        blob: "blob 7s infinite",
        "steam-1": "steam 2s ease-out infinite",
        "steam-2": "steam 2s ease-out 0.4s infinite",
        "steam-3": "steam 2s ease-out 0.8s infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "modal-in": "modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        steam: {
          "0%": {
            transform: "translateY(0) scaleX(1)",
            opacity: "0.4",
          },
          "50%": {
            transform: "translateY(-6px) scaleX(1.2)",
            opacity: "0.2",
          },
          "100%": {
            transform: "translateY(-12px) scaleX(0.8)",
            opacity: "0",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        modalIn: {
          "0%": {
            opacity: "0",
            transform: "scale(0.95) translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) translateY(0)",
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
