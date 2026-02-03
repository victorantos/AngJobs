import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import vuepressPluginAngjobs from "../../vuepress-plugin-angjobs/index.js";

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

    // Open Graph meta tags
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'AngJobs' }],
    ['meta', { property: 'og:title', content: 'AngJobs - Tech Jobs from Hacker News' }],
    ['meta', { property: 'og:description', content: 'Browse 250+ verified tech job opportunities from the monthly "Who is hiring?" threads on Hacker News.' }],
    ['meta', { property: 'og:image', content: 'https://angjobs.com/assets/social/og-image.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'AngJobs - Tech Jobs from Hacker News' }],
    ['meta', { property: 'og:url', content: 'https://angjobs.com' }],

    // Twitter Card meta tags
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'AngJobs - Tech Jobs from Hacker News' }],
    ['meta', { name: 'twitter:description', content: 'Browse 250+ verified tech job opportunities from the monthly "Who is hiring?" threads.' }],
    ['meta', { name: 'twitter:image', content: 'https://angjobs.com/assets/social/twitter-card.png' }],
    ['meta', { name: 'twitter:image:alt', content: 'AngJobs - Tech Jobs from Hacker News' }],

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
    vuepressPluginAngjobs({
      themeColor: '#FF6600'
    })
  ]
});
