import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2024)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'August-2024/',
        'July-2024/', 
        'June-2024/', // Order these items as you like
        'May-2024/'
      ],
    },
  ],
});
