<template>
  <div class="all-jobs-search">
    <div class="jobs-search">
      <input 
        type="text" 
        id="jobSearch" 
        placeholder="Search jobs..." 
        v-model="searchQuery"
        @input="performSearch"
      />
      <div class="search-results-count">
        <span id="searchCount">{{ visibleCount }}</span> jobs found
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'

export default {
  name: 'AllJobsSearch',
  setup() {
    const searchQuery = ref('')
    const visibleCount = ref(0)
    const totalJobs = ref(0)
    const jobItems = ref([])

    const performSearch = () => {
      const query = searchQuery.value.toLowerCase().trim()
      let visible = 0

      // Save search query to localStorage for persistence
      const currentUrl = window.location.pathname
      const searchKey = `search-${currentUrl}`
      if (query) {
        localStorage.setItem(searchKey, query)
      } else {
        localStorage.removeItem(searchKey)
      }

      jobItems.value.forEach(item => {
        const title = (item.dataset.title || '').toLowerCase()
        const company = (item.dataset.company || '').toLowerCase()
        
        const matches = !query || 
                       title.includes(query) || 
                       company.includes(query)

        if (matches) {
          item.style.display = ''
          visible++
        } else {
          item.style.display = 'none'
        }
      })

      visibleCount.value = visible
    }

    onMounted(() => {
      nextTick(() => {
        // Wait for the page to render completely
        setTimeout(() => {
          const foundJobItems = document.querySelectorAll('.job-item')
          jobItems.value = Array.from(foundJobItems)
          totalJobs.value = foundJobItems.length
          visibleCount.value = foundJobItems.length
          
          // Add click event listeners to save scroll position
          setupScrollPositionSaving()
          
          // Restore search query first, then scroll position
          restoreSearchState()
          
          console.log('AllJobsSearch mounted:', {
            totalJobs: totalJobs.value,
            visibleCount: visibleCount.value
          })
        }, 100)
      })
    })

    const setupScrollPositionSaving = () => {
      // Find all job links and add click listeners
      const jobLinks = document.querySelectorAll('.job-item a')
      const currentUrl = window.location.pathname
      
      jobLinks.forEach(link => {
        link.addEventListener('click', () => {
          // Save the current scroll position
          const scrollY = window.scrollY
          const scrollKey = `scroll-${currentUrl}`
          localStorage.setItem(scrollKey, scrollY.toString())
          
          // Save which job was clicked for highlighting
          const jobUrl = link.getAttribute('href')
          if (jobUrl) {
            const visitedKey = `visited-${currentUrl}`
            localStorage.setItem(visitedKey, jobUrl)
          }
        })
      })
    }

    const restoreSearchState = () => {
      const currentUrl = window.location.pathname
      const searchKey = `search-${currentUrl}`
      const savedSearchQuery = localStorage.getItem(searchKey)
      
      if (savedSearchQuery) {
        // Restore search query
        searchQuery.value = savedSearchQuery
        // Trigger search to filter results
        performSearch()
      }
      
      // After search is applied, restore scroll position
      setTimeout(() => {
        restoreScrollPosition()
      }, 50)
    }

    const restoreScrollPosition = () => {
      const currentUrl = window.location.pathname
      const scrollKey = `scroll-${currentUrl}`
      const visitedKey = `visited-${currentUrl}`
      const savedScrollY = localStorage.getItem(scrollKey)
      const visitedJobUrl = localStorage.getItem(visitedKey)
      
      if (savedScrollY) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollY))
          
          // Highlight the visited job
          if (visitedJobUrl) {
            highlightVisitedJob(visitedJobUrl)
          }
          
          // Clear the saved scroll position after using it
          localStorage.removeItem(scrollKey)
          
          // Clear the visited job after some time
          setTimeout(() => {
            localStorage.removeItem(visitedKey)
            removeJobHighlight()
          }, 10000) // Remove highlight after 10 seconds
        }, 200)
      }
    }

    const highlightVisitedJob = (visitedUrl) => {
      // Find the job item that links to the visited URL
      // Handle both .html and non-.html versions of the URL
      const cleanVisitedUrl = visitedUrl.replace('.html', '')
      
      const jobLinks = document.querySelectorAll('.job-item a')
      jobLinks.forEach(link => {
        const linkHref = link.getAttribute('href')
        const cleanLinkHref = linkHref.replace('.html', '')
        
        if (cleanLinkHref === cleanVisitedUrl || linkHref === visitedUrl) {
          const jobItem = link.closest('.job-item')
          if (jobItem) {
            jobItem.classList.add('recently-visited')
            // Add a subtle animation
            jobItem.style.animation = 'pulse-visited 2s ease-in-out'
            
            // Add a small visual indicator
            const indicator = document.createElement('span')
            indicator.className = 'visited-indicator'
            indicator.innerHTML = '👁️ Just viewed'
            indicator.style.cssText = `
              font-size: 12px;
              color: var(--angjobs-primary, #ff6600);
              font-weight: 600;
              margin-left: 8px;
              opacity: 0.8;
            `
            
            const jobTitle = jobItem.querySelector('h3')
            if (jobTitle && !jobTitle.querySelector('.visited-indicator')) {
              jobTitle.appendChild(indicator)
            }
          }
        }
      })
    }

    const removeJobHighlight = () => {
      const visitedItems = document.querySelectorAll('.job-item.recently-visited')
      visitedItems.forEach(item => {
        item.classList.remove('recently-visited')
        item.style.animation = ''
        
        // Remove the visited indicator
        const indicator = item.querySelector('.visited-indicator')
        if (indicator) {
          indicator.remove()
        }
      })
    }

    return {
      searchQuery,
      visibleCount,
      performSearch,
      setupScrollPositionSaving,
      restoreSearchState,
      restoreScrollPosition,
      highlightVisitedJob,
      removeJobHighlight
    }
  }
}
</script>

<style scoped>
.all-jobs-search {
  margin-bottom: 32px;
}

.jobs-search input {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 2px solid var(--angjobs-border, #e5e7eb);
  border-radius: var(--angjobs-border-radius, 8px);
  font-size: 16px;
  transition: var(--angjobs-transition, all 0.2s ease);
}

.jobs-search input:focus {
  outline: none;
  border-color: var(--angjobs-primary, #ff6600);
  box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
}

.search-results-count {
  margin-top: 8px;
  font-size: 14px;
  color: var(--angjobs-text-secondary, #666);
}

/* Styles for recently visited job highlighting */
:global(.job-item.recently-visited) {
  background: linear-gradient(90deg, 
    rgba(255, 102, 0, 0.1) 0%, 
    rgba(255, 102, 0, 0.05) 50%, 
    transparent 100%
  );
  border-left: 4px solid var(--angjobs-primary, #ff6600);
  box-shadow: 0 2px 8px rgba(255, 102, 0, 0.1);
  transform: translateX(4px);
  transition: all 0.3s ease;
}

/* Subtle pulse animation */
@keyframes pulse-visited {
  0% { 
    background: rgba(255, 102, 0, 0.2);
    transform: translateX(4px) scale(1);
  }
  50% { 
    background: rgba(255, 102, 0, 0.1);
    transform: translateX(4px) scale(1.005);
  }
  100% { 
    background: rgba(255, 102, 0, 0.05);
    transform: translateX(4px) scale(1);
  }
}
</style>