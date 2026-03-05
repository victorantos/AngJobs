import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2026)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'March-2026/',
        'February-2026/',
        'January-2026/' 
      ],
    },
  ],
});
