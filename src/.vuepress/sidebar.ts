import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2025)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'January-2026/',
        'December-2025/',
        'November-2025/' 
      ],
    },
  ],
});
