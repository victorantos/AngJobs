import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2025)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'March-2025/',
        'February-2025/',
        'January-2025/'
      ],
    },
  ],
});
