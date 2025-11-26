import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "Jobs",
    icon: "briefcase",
    prefix: "/jobs/",
    children: [
      { text: "November 2025", link: "November-2025/" },
      { text: "October 2025", link: "October-2025/" },
      { text: "September 2025", link: "September-2025/" }
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
