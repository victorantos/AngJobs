import { defineUserConfig } from "vuepress";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "en-US",
  title: "ANGJOBS",
  description: "Jobs for hackers",

  theme,

  // Enable it with pwa
  // shouldPrefetch: false,
});
