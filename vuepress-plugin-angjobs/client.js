import { defineClientConfig } from 'vuepress/client'
import MyComponent from './MyComponent.vue'
import JobApplication from './JobApplication.vue'
import JobListing from './JobListing.vue'
import JobListingSimple from './JobListingSimple.vue'
import MonthlyJobsPage from './MonthlyJobsPage.vue'
import JobSearch from './JobSearch.vue'

export default defineClientConfig({
  enhance({ app }) {
    app.component('MyComponent', MyComponent);
    app.component('JobApplication', JobApplication);
    app.component('JobListing', JobListing);
    app.component('JobListingSimple', JobListingSimple);
    app.component('MonthlyJobsPage', MonthlyJobsPage);
    app.component('JobSearch', JobSearch);
  },
})