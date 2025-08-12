<template>
  <div class="job-navigation">
    <div class="job-nav-breadcrumb">
      <a href="/jobs/" class="nav-link">📋 All Months</a>
      <span class="nav-separator">→</span>
      <a :href="monthUrl" class="nav-link">📅 {{ monthName }}</a>
      <span class="nav-separator">→</span>
      <a :href="allJobsUrl" class="nav-link">🔍 All {{ monthName }} Jobs</a>
    </div>
    
    <div class="job-nav-buttons">
      <a :href="allJobsUrl" class="nav-button primary" @click="handleBackToAllJobs">
        ← Back to All {{ monthName }} Jobs
      </a>
      <a :href="monthUrl" class="nav-button secondary">
        📅 {{ monthName }} Overview
      </a>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'JobNavigation',
  setup() {
    const monthName = ref('')
    const monthUrl = ref('')
    const allJobsUrl = ref('')

    onMounted(() => {
      // Extract month from current URL path
      const currentPath = window.location.pathname
      const monthMatch = currentPath.match(/\/jobs\/([A-Za-z]+-20\d{2})\//)
      
      if (monthMatch) {
        const monthSlug = monthMatch[1] // e.g., "August-2025"
        const formattedMonth = monthSlug.replace('-', ' ') // e.g., "August 2025"
        
        monthName.value = formattedMonth
        monthUrl.value = `/jobs/${monthSlug}/`
        allJobsUrl.value = `/jobs/${monthSlug}/all-jobs.html`
      } else {
        // Fallback if we can't detect the month
        monthName.value = 'Jobs'
        monthUrl.value = '/jobs/'
        allJobsUrl.value = '/jobs/'
      }
    })

    const handleBackToAllJobs = (event) => {
      event.preventDefault()
      
      // Save current job URL as the visited job for highlighting
      const currentJobUrl = window.location.pathname
      const visitedKey = `visited-${allJobsUrl.value}`
      localStorage.setItem(visitedKey, currentJobUrl)
      
      // Get the stored scroll position for this all-jobs page
      const scrollKey = `scroll-${allJobsUrl.value}`
      const savedScrollY = localStorage.getItem(scrollKey)
      
      // Navigate to the all-jobs page
      window.location.href = allJobsUrl.value
      
      // The scroll position restoration and job highlighting will be handled
      // by the AllJobsSearch component when the page loads
    }

    return {
      monthName,
      monthUrl,
      allJobsUrl,
      handleBackToAllJobs
    }
  }
}
</script>

<style scoped>
.job-navigation {
  background: var(--angjobs-bg-main, #f6f6ef);
  border: 1px solid var(--angjobs-border, #e5e7eb);
  border-radius: var(--angjobs-border-radius, 8px);
  padding: 16px 20px;
  margin: 20px 0;
}

.job-nav-breadcrumb {
  font-size: 14px;
  color: var(--angjobs-text-secondary, #666);
  margin-bottom: 12px;
}

.job-nav-breadcrumb .nav-link {
  color: var(--angjobs-primary, #ff6600);
  text-decoration: none;
  font-weight: 500;
}

.job-nav-breadcrumb .nav-link:hover {
  text-decoration: underline;
}

.job-nav-breadcrumb .nav-separator {
  margin: 0 8px;
  color: var(--angjobs-text-secondary, #999);
}

.job-nav-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-button {
  display: inline-block;
  padding: 8px 16px;
  border-radius: var(--angjobs-border-radius, 6px);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: var(--angjobs-transition, all 0.2s ease);
}

.nav-button.primary {
  background: var(--angjobs-primary, #ff6600);
  color: white;
}

.nav-button.primary:hover {
  background: var(--angjobs-primary-dark, #e55500);
  transform: translateY(-1px);
}

.nav-button.secondary {
  background: white;
  color: var(--angjobs-text-primary, #1a1a1a);
  border: 1px solid var(--angjobs-border, #e5e7eb);
}

.nav-button.secondary:hover {
  background: var(--angjobs-bg-main, #f6f6ef);
  border-color: var(--angjobs-primary, #ff6600);
}

@media (max-width: 768px) {
  .job-navigation {
    padding: 12px 16px;
  }
  
  .job-nav-buttons {
    flex-direction: column;
  }
  
  .nav-button {
    text-align: center;
  }
}
</style>