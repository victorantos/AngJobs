import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2025)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'December-2025/',
        'November-2025/',
        'October-2025/' 
      ],
    },
  ],
});
