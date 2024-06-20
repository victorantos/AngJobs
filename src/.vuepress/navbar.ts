import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  "/portfolio",
  "/demo/",
  {
    text: "HN",
    icon: "lightbulb",
    prefix: "/hn/",
    children: [
      {
        text: "May",
        icon: "lightbulb",
        prefix: "may-2024/",
        children: ["baz", { text: "...", icon: "ellipsis", link: "#" }],
      },
      {
        text: "June",
        icon: "lightbulb",
        prefix: "june-2024/",
        children: ["ray", { text: "...", icon: "ellipsis", link: "#" }],
      },
    ],
  },
  {
    text: "V2 Docs",
    icon: "book",
    link: "https://theme-hope.vuejs.press/",
  },
]);
