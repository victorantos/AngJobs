export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/index.html.js"), meta: {"t":"Project home","i":"home"} }],
  ["/portfolio.html", { loader: () => import(/* webpackChunkName: "portfolio.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/portfolio.html.js"), meta: {"t":"Portfolio Home","i":"home"} }],
  ["/guide/", { loader: () => import(/* webpackChunkName: "guide_index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/guide/index.html.js"), meta: {"t":"Guide","i":"lightbulb"} }],
  ["/demo/", { loader: () => import(/* webpackChunkName: "demo_index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/index.html.js"), meta: {"t":"Features demo","i":"laptop-code"} }],
  ["/demo/disable.html", { loader: () => import(/* webpackChunkName: "demo_disable.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/disable.html.js"), meta: {"t":"Disabling layout and features","i":"gears","O":4} }],
  ["/demo/encrypt.html", { loader: () => import(/* webpackChunkName: "demo_encrypt.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/encrypt.html.js"), meta: {"t":"Encryption Article","i":"lock"} }],
  ["/demo/layout.html", { loader: () => import(/* webpackChunkName: "demo_layout.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/layout.html.js"), meta: {"t":"Layout","i":"object-group","O":2} }],
  ["/demo/markdown.html", { loader: () => import(/* webpackChunkName: "demo_markdown.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/markdown.html.js"), meta: {"t":"Markdown Enhance","i":"fab fa-markdown","O":2} }],
  ["/demo/page.html", { loader: () => import(/* webpackChunkName: "demo_page.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/demo/page.html.js"), meta: {"t":"Page Config","i":"file","O":3} }],
  ["/guide/bar/", { loader: () => import(/* webpackChunkName: "guide_bar_index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/guide/bar/index.html.js"), meta: {"t":"Bar feature","i":"lightbulb"} }],
  ["/guide/bar/baz.html", { loader: () => import(/* webpackChunkName: "guide_bar_baz.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/guide/bar/baz.html.js"), meta: {"t":"Baz","i":"circle-info"} }],
  ["/guide/foo/", { loader: () => import(/* webpackChunkName: "guide_foo_index.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/guide/foo/index.html.js"), meta: {"t":"Foo feature","i":"lightbulb"} }],
  ["/guide/foo/ray.html", { loader: () => import(/* webpackChunkName: "guide_foo_ray.html" */"/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/guide/foo/ray.html.js"), meta: {"t":"Ray","i":"circle-info"} }],
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
