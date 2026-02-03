import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Jobs",
    icon: "briefcase",
    prefix: "/jobs/",
    children: [
      { text: "February 2026", link: "February-2026/" },
      { text: "January 2026", link: "January-2026/" },
      { text: "December 2025", link: "December-2025/" }
    ]
  },
  {
    text: "Post a Job",
    icon: "plus",
    link: "/jobs/"
  },
  {
    text: "About",
    icon: "user",
    link: "/about"
  }
]);
