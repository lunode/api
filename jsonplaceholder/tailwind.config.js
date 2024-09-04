/** @type {import('tailwindcss').Config} */
/* 
  tailwind 从 cdn 引入，配置本 config 文件只是为了 vscode 的 tailwindcss 插件能有只能提示。
*/
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
