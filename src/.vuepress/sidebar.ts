import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2026)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'June-2026/',
        'May-2026/',
        'April-2026/' 
      ],
    },
  ],
});
