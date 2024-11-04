import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2024)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'November-2024/',
        'October-2024/',
        'September-2024/'
      ],
    },
  ],
});
