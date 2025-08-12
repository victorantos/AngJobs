import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2025)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'August-2025/',
        'July-2025/',
        'June-2025/' 
      ],
    },
  ],
});
