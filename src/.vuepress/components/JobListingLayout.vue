<template>
  <div class="job-listing-page">
    <nav class="breadcrumb">
      <a href="/">Home</a>
      <span class="separator">›</span>
      <a href="/jobs/">Jobs</a>
      <span class="separator">›</span>
      <span class="current">{{ monthYear }}</span>
    </nav>
    
    <JobListing 
      :jobs="processedJobs" 
      :month-year="monthYear"
    />
  </div>
</template>

<script>
import { computed } from 'vue'
import { usePageData, usePageFrontmatter } from '@vuepress/client'

export default {
  name: 'JobListingLayout',
  setup() {
    const page = usePageData()
    const frontmatter = usePageFrontmatter()
    
    const monthYear = computed(() => {
      const path = page.value.path
      const match = path.match(/\/jobs\/([^/]+)\//)
      return match ? match[1].replace('-', ' ') : 'Current Month'
    })
    
    const processedJobs = computed(() => {
      // This would be populated by processing the markdown files
      // For now, returning empty array - would need server-side processing
      return []
    })
    
    return {
      monthYear,
      processedJobs
    }
  }
}
</script>

<style scoped>
.job-listing-page {
  min-height: 100vh;
  background: #ffffff;
}

.breadcrumb {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  font-size: 14px;
  color: #666;
}

.breadcrumb a {
  color: #666;
  text-decoration: none;
}

.breadcrumb a:hover {
  color: #ff6600;
  text-decoration: underline;
}

.breadcrumb .separator {
  margin: 0 8px;
  color: #ccc;
}

.breadcrumb .current {
  color: #1a1a1a;
}
</style>