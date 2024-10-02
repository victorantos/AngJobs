import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2024)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'October-2024/',
        'September-2024/',
        'August-2024/',
        'July-2024/'
      ],
    },
  ],
});
