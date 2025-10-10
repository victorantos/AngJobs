import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2025)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'October-2025/',
        'September-2025/',
        'August-2025/' 
      ],
    },
  ],
});
