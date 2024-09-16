import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import  vuepressPluginHello from  "../../vuepress-plugin-hello/index.js";

export default defineUserConfig({
  base: "/",

  lang: "en-US",
  title: "ANGJOBS",
  description: "Jobs for hackers",

  theme,

  // Enable it with pwa
  // shouldPrefetch: false,
  head: [
    // Other head elements...
    ['script', {
      'data-goatcounter': 'https://angjobs.goatcounter.com/count',
      async: true,
      src: '//gc.zgo.at/count.js'
    }]
  ],
  plugins: [
    [
      vuepressPluginHello({
        greeting: 'Hello VuePress!',
        themeColor: '#42b983'
      }) // relative path to your plugin
    ]
  ]
});
