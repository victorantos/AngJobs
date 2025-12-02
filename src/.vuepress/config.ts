import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import vuepressPluginHello from "../../vuepress-plugin-hello/index.js";

export default defineUserConfig({
  base: "/",

  lang: "en-US",
  title: "AngJobs",
  description: "Find your next hacker job from Hacker News monthly threads. Browse the latest tech jobs, remote positions, and startup opportunities.",

  theme,

  // Enable it with pwa
  shouldPrefetch: false,
  
  head: [
    // SEO and meta tags
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'keywords', content: 'hacker news jobs, tech jobs, remote jobs, startup jobs, developer jobs, programming jobs' }],
    ['meta', { name: 'author', content: 'victorantos' }],
    // Note: og:* and twitter:* tags are handled by vuepress-theme-hope SEO plugin per-page
    
    // Favicon and icons
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon-simple.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/icon-512.png' }],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
    
    // Structured data for job board
    ['script', {
      type: 'application/ld+json'
    }, JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "AngJobs",
      "url": "https://angjobs.com",
      "description": "Hacker News job board with the latest tech and startup opportunities",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://angjobs.com/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    })],
    
    // Analytics
    ['script', {
      'data-goatcounter': 'https://angjobs.goatcounter.com/count',
      async: true,
      src: '//gc.zgo.at/count.js'
    }]
  ],
  
  plugins: [
    vuepressPluginHello({
      greeting: 'Hello VuePress!',
      themeColor: '#FF6600'
    })
  ]
});
