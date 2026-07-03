import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2026)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'July-2026/',
        'June-2026/',
        'May-2026/' 
      ],
    },
  ],
});
