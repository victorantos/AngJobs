import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2026)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'February-2026/',
        'January-2026/',
        'December-2025/' 
      ],
    },
  ],
});
