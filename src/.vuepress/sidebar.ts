import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "", 
    {
      text: "Who's hiring? (2024)",
      icon: "computer",
      prefix: "hn/",
      children: "structure",
    },
  ],
});
