import { defineClientConfig } from '@vuepress/client'
import JobCard from './components/JobCard.vue'
import JobPost from './components/JobPost.vue'
import FilterModal from './components/FilterModal.vue'
import AllJobsSearch from './components/AllJobsSearch.vue'
import JobNavigation from './components/JobNavigation.vue'

export default defineClientConfig({
  enhance({ app }) {
    // Register global components
    app.component('JobCard', JobCard)
    app.component('JobPost', JobPost)
    app.component('FilterModal', FilterModal)
    app.component('AllJobsSearch', AllJobsSearch)
    app.component('JobNavigation', JobNavigation)
    // Note: JobSearch comes from vuepress-plugin-hello
  },
})