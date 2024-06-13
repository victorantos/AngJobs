import comp from "/Users/victora/RiderProjects/AngJobs/src/.vuepress/.temp/pages/guide/bar/baz.html.vue"
const data = JSON.parse("{\"path\":\"/guide/bar/baz.html\",\"title\":\"Baz\",\"lang\":\"en-US\",\"frontmatter\":{\"title\":\"Baz\",\"icon\":\"circle-info\",\"description\":\"Feature details here.\",\"gitInclude\":[],\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://vuepress-theme-hope-docs-demo.netlify.app/guide/bar/baz.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"Docs Demo\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"Baz\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"Feature details here.\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"en-US\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"Mr.Hope\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"Baz\\\",\\\"image\\\":[\\\"\\\"],\\\"dateModified\\\":null,\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"Mr.Hope\\\",\\\"url\\\":\\\"https://mister-hope.com\\\"}]}\"]]},\"headers\":[],\"readingTime\":{\"minutes\":0.03,\"words\":8},\"filePathRelative\":\"guide/bar/baz.md\",\"autoDesc\":true}")
export { comp, data }

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
