<template>
  <div class="job-navigation">
    <div class="job-nav-breadcrumb">
      <a href="/jobs/" class="nav-breadcrumb-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
        All Months
      </a>
      <svg class="nav-separator" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <a :href="monthUrl" class="nav-breadcrumb-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        {{ monthName }}
      </a>
      <svg class="nav-separator" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <a :href="allJobsUrl" class="nav-breadcrumb-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        All Jobs
      </a>
    </div>

    <div class="job-nav-buttons">
      <a :href="allJobsUrl" class="nav-button nav-button--primary" @click="handleBackToAllJobs">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to All {{ monthName }} Jobs
      </a>
      <a :href="monthUrl" class="nav-button nav-button--secondary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        {{ monthName }} Overview
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
      const currentPath = window.location.pathname
      const monthMatch = currentPath.match(/\/jobs\/([A-Za-z]+-20\d{2})\//)

      if (monthMatch) {
        const monthSlug = monthMatch[1]
        const formattedMonth = monthSlug.replace('-', ' ')

        monthName.value = formattedMonth
        monthUrl.value = `/jobs/${monthSlug}/`
        allJobsUrl.value = `/jobs/${monthSlug}/all-jobs.html`
      } else {
        monthName.value = 'Jobs'
        monthUrl.value = '/jobs/'
        allJobsUrl.value = '/jobs/'
      }
    })

    const handleBackToAllJobs = (event) => {
      event.preventDefault()

      const currentJobUrl = window.location.pathname
      const visitedKey = `visited-${allJobsUrl.value}`
      localStorage.setItem(visitedKey, currentJobUrl)

      const scrollKey = `scroll-${allJobsUrl.value}`
      const savedScrollY = localStorage.getItem(scrollKey)

      window.location.href = allJobsUrl.value
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
  background: var(--apple-bg-primary, #FFFFFF);
  border-radius: var(--apple-radius-lg, 20px);
  padding: 20px 24px;
  margin: 24px 0;
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
}

/* Breadcrumb Navigation */
.job-nav-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.nav-breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--apple-text-secondary, #6E6E73);
  text-decoration: none;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: var(--apple-radius-sm, 10px);
  transition: all 0.2s ease-out;
}

.nav-breadcrumb-link:hover {
  color: var(--apple-primary, #F97316);
  background: var(--apple-primary-subtle, #FFF7ED);
}

.nav-breadcrumb-link svg {
  opacity: 0.7;
}

.nav-breadcrumb-link:hover svg {
  opacity: 1;
}

.nav-separator {
  color: var(--apple-text-tertiary, #86868B);
  flex-shrink: 0;
}

/* Navigation Buttons */
.job-nav-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: var(--apple-radius-pill, 9999px);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.25s ease-out;
}

.nav-button--primary {
  background: var(--apple-primary, #F97316);
  color: white;
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
}

.nav-button--primary:hover {
  background: var(--apple-primary-hover, #EA580C);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);
}

.nav-button--secondary {
  background: var(--apple-bg-secondary, #F5F5F7);
  color: var(--apple-text-primary, #1D1D1F);
}

.nav-button--secondary:hover {
  background: var(--apple-border-light, rgba(0, 0, 0, 0.08));
  transform: translateY(-2px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .job-navigation {
    padding: 16px 20px;
    border-radius: var(--apple-radius-md, 14px);
    margin: 16px 0;
  }

  .job-nav-breadcrumb {
    font-size: 12px;
    gap: 4px;
    margin-bottom: 14px;
  }

  .nav-breadcrumb-link {
    padding: 2px 4px;
    gap: 4px;
  }

  .nav-breadcrumb-link svg {
    width: 14px;
    height: 14px;
  }

  .nav-separator {
    width: 14px;
    height: 14px;
  }

  .job-nav-buttons {
    flex-direction: column;
  }

  .nav-button {
    justify-content: center;
    text-align: center;
    padding: 14px 20px;
  }
}

/* Dark Mode */
html.dark .job-navigation {
  background: var(--apple-bg-secondary, #2C2C2E);
}

html.dark .nav-button--secondary {
  background: var(--apple-bg-tertiary, #3A3A3C);
}
</style>
