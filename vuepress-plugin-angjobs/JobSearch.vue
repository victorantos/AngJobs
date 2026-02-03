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
      
      // Use stored job links from mounting
      const jobLinks = window.angJobsLinks || []
      
      let visible = 0
      
      console.log('Searching for:', query)
      console.log('Available job links:', jobLinks.length)

      // If no query, show all jobs
      if (!query) {
        jobLinks.forEach(link => {
          const listItem = link.closest('li')
          if (listItem) {
            listItem.style.display = ''
            visible++
          }
        })
      } else {
        // Search through job links
        jobLinks.forEach(link => {
          const linkText = (link.textContent || '').toLowerCase()
          const href = (link.getAttribute('href') || '').toLowerCase()
          
          const matches = linkText.includes(query) || href.includes(query)

          const listItem = link.closest('li')
          if (listItem) {
            if (matches) {
              listItem.style.display = ''
              visible++
            } else {
              listItem.style.display = 'none'
            }
          }
        })
      }

      visibleCount.value = visible
      console.log('Visible jobs after search:', visible)
    }

    onMounted(() => {
      nextTick(() => {
        // Give VuePress time to render the sidebar
        setTimeout(() => {
          // Clear any previous search data
          searchQuery.value = ''
          
          // Try multiple selectors to find job links in sidebar
          const possibleSelectors = [
            'a[href*=".md"]',  // Any links to .md files
            '.sidebar-link[href*=".md"]',  // VuePress sidebar links
            '[href*="/jobs/"]',  // Any job-related links
            '.sidebar a[href*="-2025/"]',  // Month-based job links
            'a[href*="August-2025"], a[href*="July-2025"], a[href*="June-2025"]'  // Specific month links
          ]
          
          let jobLinks = []
          let foundSelector = ''
          
          // Try each selector until we find job links
          for (const selector of possibleSelectors) {
            const links = document.querySelectorAll(selector)
            console.log(`Trying selector "${selector}": found ${links.length} links`)
            
            // Filter to actual job files (exclude README, index, etc.)
            const filteredLinks = Array.from(links).filter(link => {
              const href = link.getAttribute('href') || ''
              return href.includes('-2025/') && 
                     href.endsWith('.md') && 
                     !href.includes('README') && 
                     !href.includes('index') &&
                     !href.includes('all-jobs')
            })
            
            if (filteredLinks.length > 0) {
              jobLinks = filteredLinks
              foundSelector = selector
              break
            }
          }
          
          const jobCount = jobLinks.length
          totalJobs.value = jobCount
          visibleCount.value = jobCount
          
          console.log('JobSearch component mounted:', {
            foundSelector,
            totalJobs: totalJobs.value,
            visibleCount: visibleCount.value,
            sampleLinks: jobLinks.slice(0, 3).map(link => link.getAttribute('href'))
          })
          
          // Store the job links for search functionality
          window.angJobsLinks = jobLinks
          
        }, 100)  // Give VuePress time to render
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