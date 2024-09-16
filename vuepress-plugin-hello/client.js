import { defineClientConfig } from 'vuepress/client'
import MyComponent from './MyComponent.vue'

export default defineClientConfig({
  enhance({ app }) {
    app.component('MyComponent', MyComponent);
    
  },
})