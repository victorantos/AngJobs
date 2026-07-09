import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Jobs",
    icon: "briefcase",
    prefix: "/jobs/",
    children: [
      { text: "May 2026", link: "May-2026/" },
      "April-2026/",
    ],
  },
  { text: "About", link: "/about" },
]);
