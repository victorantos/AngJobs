import { defineClientConfig } from '@vuepress/client'
import JobCard from './components/JobCard.vue'
import JobSearch from './components/JobSearch.vue'
import JobPost from './components/JobPost.vue'
import FilterModal from './components/FilterModal.vue'

export default defineClientConfig({
  enhance({ app }) {
    // Register global components
    app.component('JobCard', JobCard)
    app.component('JobSearch', JobSearch)
    app.component('JobPost', JobPost)
    app.component('FilterModal', FilterModal)
  },
})