/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // index.htmlを追加
    "./src/**/*.{js,ts,jsx,tsx}", // srcディレクトリ配下のすべてのコンポーネントファイルを対象にする
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}