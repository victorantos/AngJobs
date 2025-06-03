import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2025)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'June-2025/',
        'May-2025/',     
        'April-2025/'
      ],
    },
  ],
});
