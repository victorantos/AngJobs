import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "", 
    {
      text: "Who's hiring? (2024)",
      icon: "computer",
      prefix: "/hn",
      
      children: [
        'June-2024/', // Order these items as you like
        'May-2024/',
        'April-2024/',
        'March-2024/',
        'February-2024/'
      ],
    },
  ],
});
