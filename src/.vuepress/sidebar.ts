import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2026)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'May-2026/',
        'April-2026/',
        'March-2026/' 
      ],
    },
  ],
});
