import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Jobs",
    icon: "briefcase",
    prefix: "/jobs/",
    children: [
      { text: "June 2026", link: "June-2026/" },
      { text: "May 2026", link: "May-2026/" },
      { text: "April 2026", link: "April-2026/" }
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
