<template>
  <div class="jobs-search">
    <input 
      type="text" 
      id="jobSearch" 
      v-model="searchQuery"
      @input="performSearch"
      placeholder="Search jobs..." 
    />
    <div class="search-results-count">
      <span id="searchCount">{{ visibleCount }}</span> jobs found
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'

export default {
  name: 'JobSearch',
  setup() {
    const searchQuery = ref('')
    const visibleCount = ref(0)
    const totalJobs = ref(0)

    const performSearch = () => {
      const query = searchQuery.value.toLowerCase().trim()
      const jobItems = document.querySelectorAll('.job-item')
      let visible = 0

      console.log('Searching for:', query)

      jobItems.forEach(item => {
        const title = (item.dataset.title || '').toLowerCase()
        const company = (item.dataset.company || '').toLowerCase()
        const textContent = (item.textContent || '').toLowerCase()

        // Search in title, company, and full text content
        const matches = !query || 
                       title.includes(query) || 
                       company.includes(query) ||
                       textContent.includes(query)

        if (matches) {
          item.style.display = ''
          visible++
        } else {
          item.style.display = 'none'
        }
      })

      visibleCount.value = visible
      console.log('Visible jobs:', visible)
    }

    onMounted(() => {
      nextTick(() => {
        const jobItems = document.querySelectorAll('.job-item')
        totalJobs.value = jobItems.length
        visibleCount.value = jobItems.length
        
        console.log('JobSearch component mounted:', {
          totalJobs: totalJobs.value,
          visibleCount: visibleCount.value
        })
      })
    })

    return {
      searchQuery,
      visibleCount,
      performSearch
    }
  }
}
</script>

<style scoped>
.jobs-search {
  margin-bottom: 32px;
}

#jobSearch {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 2px solid var(--angjobs-border, #e5e7eb);
  border-radius: var(--angjobs-border-radius, 8px);
  font-size: 16px;
  transition: var(--angjobs-transition, all 0.2s ease);
}

#jobSearch:focus {
  outline: none;
  border-color: var(--angjobs-primary, #ff6600);
  box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
}

.search-results-count {
  margin-top: 8px;
  font-size: 14px;
  color: var(--angjobs-text-secondary, #666);
}
</style>