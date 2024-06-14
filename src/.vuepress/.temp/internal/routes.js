export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/index.html.js"), meta: {"t":"Project home","i":"home"} }],
  ["/portfolio.html", { loader: () => import(/* webpackChunkName: "portfolio.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/portfolio.html.js"), meta: {"t":"Portfolio Home","i":"home"} }],
  ["/demo/", { loader: () => import(/* webpackChunkName: "demo_index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/index.html.js"), meta: {"t":"Features demo","i":"laptop-code"} }],
  ["/demo/disable.html", { loader: () => import(/* webpackChunkName: "demo_disable.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/disable.html.js"), meta: {"t":"Disabling layout and features","i":"gears","O":4} }],
  ["/demo/encrypt.html", { loader: () => import(/* webpackChunkName: "demo_encrypt.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/encrypt.html.js"), meta: {"t":"Encryption Article","i":"lock"} }],
  ["/demo/layout.html", { loader: () => import(/* webpackChunkName: "demo_layout.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/layout.html.js"), meta: {"t":"Layout","i":"object-group","O":2} }],
  ["/demo/markdown.html", { loader: () => import(/* webpackChunkName: "demo_markdown.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/markdown.html.js"), meta: {"t":"Markdown Enhance","i":"fab fa-markdown","O":2} }],
  ["/demo/page.html", { loader: () => import(/* webpackChunkName: "demo_page.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/page.html.js"), meta: {"t":"Page Config","i":"file","O":3} }],
  ["/hn/", { loader: () => import(/* webpackChunkName: "hn_index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/index.html.js"), meta: {"t":"Guide","i":"lightbulb"} }],
  ["/hn/june-2024/", { loader: () => import(/* webpackChunkName: "hn_june-2024_index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/june-2024/index.html.js"), meta: {"t":"June 2024","i":"lightbulb"} }],
  ["/hn/june-2024/ux-designer.html", { loader: () => import(/* webpackChunkName: "hn_june-2024_ux-designer.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/june-2024/ux-designer.html.js"), meta: {"t":"UX Designer","i":"minus"} }],
  ["/hn/may-2024/Project-Manger%20copy%204.html", { loader: () => import(/* webpackChunkName: "hn_may-2024_Project-Manger copy 4.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/may-2024/Project-Manger copy 4.html.js"), meta: {"t":"Project Manager","i":"minus"} }],
  ["/hn/may-2024/Project-Manger%20copy.html", { loader: () => import(/* webpackChunkName: "hn_may-2024_Project-Manger copy.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/may-2024/Project-Manger copy.html.js"), meta: {"t":"Project Manager","i":"minus"} }],
  ["/hn/may-2024/Project-Manger.html", { loader: () => import(/* webpackChunkName: "hn_may-2024_Project-Manger.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/may-2024/Project-Manger.html.js"), meta: {"t":"Project Manager","i":"minus"} }],
  ["/hn/may-2024/", { loader: () => import(/* webpackChunkName: "hn_may-2024_index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/may-2024/index.html.js"), meta: {"t":"May 2024","i":"lightbulb"} }],
  ["/hn/may-2024/Software-Architect.html", { loader: () => import(/* webpackChunkName: "hn_may-2024_Software-Architect.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/may-2024/Software-Architect.html.js"), meta: {"t":"Software Architect","i":"minus"} }],
  ["/hn/may-2024/software-engineer-microsoft.html", { loader: () => import(/* webpackChunkName: "hn_may-2024_software-engineer-microsoft.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/may-2024/software-engineer-microsoft.html.js"), meta: {"t":"Software Engineer Microsoft","i":"minus"} }],
  ["/hn/may-2024/web-developer-apple.html", { loader: () => import(/* webpackChunkName: "hn_may-2024_web-developer-apple.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/hn/may-2024/web-developer-apple.html.js"), meta: {"t":"Web developer Apple","i":"minus"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/404.html.js"), meta: {"t":""} }],
]);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateRoutes) {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
  }
  if (__VUE_HMR_RUNTIME__.updateRedirects) {
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ routes, redirects }) => {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  })
}
