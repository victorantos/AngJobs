import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    {
      text: "Who's hiring? (2025)",
      icon: "computer",
      prefix: "/jobs",
      
      children: [
        'January-2025/',
        'December-2024/',
        'November-2024/',
       
      ],
    },
  ],
});
