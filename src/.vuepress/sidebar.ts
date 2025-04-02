import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2025)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'April-2025/',
        'March-2025/',
        'February-2025/'      
      ],
    },
  ],
});
