import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2026)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'April-2026/',
        'March-2026/',
        'February-2026/' 
      ],
    },
  ],
});
