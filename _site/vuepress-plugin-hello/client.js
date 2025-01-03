import { defineClientConfig } from 'vuepress/client'
import MyComponent from './MyComponent.vue'
import JobApplication from './JobApplication.vue'

export default defineClientConfig({
  enhance({ app }) {
    app.component('MyComponent', MyComponent);
    app.component('JobApplication', JobApplication);
  },
})