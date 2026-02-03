<template>
  <div class="monthly-jobs-container">
    <!-- Header with Glass Effect -->
    <header class="jobs-header glass">
      <div class="header-content">
        <div class="logo-section">
          <a href="/" class="logo-link">
            <span class="logo-text">AngJobs</span>
          </a>
          <span class="tagline">Tech Jobs from Hacker News</span>
        </div>
        <nav class="header-nav">
          <a href="/" class="nav-link">Home</a>
          <a href="/jobs/" class="nav-link">All Jobs</a>
          <a href="https://news.ycombinator.com/item?id=whoishiring" target="_blank" class="nav-link nav-link--external">
            Submit Job
            <svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="jobs-main">
      <div class="jobs-content">
        <h1 class="page-title">{{ formattedMonth }} Jobs</h1>

        <!-- Search and Filters -->
        <div class="search-section">
          <div class="search-wrapper">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search jobs, companies, locations, skills..."
              class="search-input"
              @input="handleSearch"
            />
            <button v-if="searchQuery" @click="clearSearch" class="clear-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="filter-chips">
            <button
              class="filter-chip"
              :class="{ active: filters.remote }"
              @click="filters.remote = !filters.remote"
            >
              <svg v-if="filters.remote" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Remote
            </button>
            <button
              class="filter-chip"
              :class="{ active: filters.onsite }"
              @click="filters.onsite = !filters.onsite"
            >
              <svg v-if="filters.onsite" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              On-site
            </button>
            <button
              class="filter-chip"
              :class="{ active: filters.hybrid }"
              @click="filters.hybrid = !filters.hybrid"
            >
              <svg v-if="filters.hybrid" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Hybrid
            </button>
          </div>
        </div>

        <!-- Results Info -->
        <div class="results-info">
          <span class="result-count">{{ filteredJobs.length }} jobs found</span>
          <button v-if="hasActiveFilters" @click="resetFilters" class="reset-filters">
            Clear all
          </button>
        </div>

        <!-- Job Cards -->
        <div class="job-cards">
          <article
            v-for="(job, index) in displayedJobs"
            :key="job.filename"
            class="job-card"
            @click="navigateToJob(job)"
          >
            <div class="job-card-header">
              <div class="company-logo">
                <span class="company-initial">{{ getCompanyInitial(job.company) }}</span>
              </div>
              <div class="job-card-header-content">
                <h2 class="job-position">{{ job.position }}</h2>
                <div class="job-company">
                  <span class="company-name">{{ job.company }}</span>
                  <span v-if="job.location" class="location">{{ job.location }}</span>
                </div>
              </div>
              <button class="save-job" @click.stop="toggleSave(job)" :class="{ saved: job.saved }">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>

            <div class="job-tags">
              <span v-if="job.type" class="job-tag">{{ job.type }}</span>
              <span v-if="job.salary" class="job-tag job-tag--salary">{{ job.salary }}</span>
              <span v-for="tag in job.tags?.slice(0, 3)" :key="tag" class="job-tag">{{ tag }}</span>
              <span v-if="job.tags?.length > 3" class="job-tag job-tag--more">+{{ job.tags.length - 3 }}</span>
            </div>

            <div class="job-footer">
              <span class="posted-info">{{ job.timeAgo }} by {{ job.author }}</span>
              <a :href="job.hnUrl" @click.stop class="hn-link" target="_blank">
                HN
                <svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </article>
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="load-more-section">
          <button @click="loadMore" class="load-more-btn">
            Load More Jobs
          </button>
        </div>

        <!-- No Results -->
        <div v-if="filteredJobs.length === 0" class="no-results">
          <div class="no-results-icon-wrapper">
            <svg class="no-results-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <h3>No jobs found</h3>
          <p>Try adjusting your search or filters</p>
          <button @click="resetFilters" class="reset-btn">Reset all filters</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'MonthlyJobsPage',
  props: {
    month: {
      type: String,
      required: true
    },
    jobs: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const router = useRouter()
    const searchQuery = ref('')
    const filters = ref({
      remote: false,
      onsite: false,
      hybrid: false
    })
    const displayCount = ref(30)
    const savedJobs = ref(new Set())

    const formattedMonth = computed(() => {
      return props.month.replace('-', ' ')
    })

    const filteredJobs = computed(() => {
      let jobs = [...props.jobs]

      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        jobs = jobs.filter(job =>
          job.position?.toLowerCase().includes(query) ||
          job.company?.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query) ||
          job.tags?.some(tag => tag.toLowerCase().includes(query))
        )
      }

      // Type filters
      const activeTypeFilters = []
      if (filters.value.remote) activeTypeFilters.push('remote')
      if (filters.value.onsite) activeTypeFilters.push('onsite')
      if (filters.value.hybrid) activeTypeFilters.push('hybrid')

      if (activeTypeFilters.length > 0) {
        jobs = jobs.filter(job => {
          const jobType = job.type?.toLowerCase() || ''
          const jobLocation = job.location?.toLowerCase() || ''
          return activeTypeFilters.some(filter =>
            jobType.includes(filter) || jobLocation.includes(filter)
          )
        })
      }

      return jobs
    })

    const displayedJobs = computed(() => {
      return filteredJobs.value.slice(0, displayCount.value).map(job => ({
        ...job,
        saved: savedJobs.value.has(job.filename)
      }))
    })

    const hasMore = computed(() => {
      return displayCount.value < filteredJobs.value.length
    })

    const hasActiveFilters = computed(() => {
      return searchQuery.value || Object.values(filters.value).some(v => v)
    })

    const handleSearch = () => {
      displayCount.value = 30
    }

    const clearSearch = () => {
      searchQuery.value = ''
    }

    const resetFilters = () => {
      searchQuery.value = ''
      filters.value = {
        remote: false,
        onsite: false,
        hybrid: false
      }
      displayCount.value = 30
    }

    const loadMore = () => {
      displayCount.value += 30
    }

    const toggleSave = (job) => {
      if (savedJobs.value.has(job.filename)) {
        savedJobs.value.delete(job.filename)
      } else {
        savedJobs.value.add(job.filename)
      }
      localStorage.setItem('savedJobs', JSON.stringify([...savedJobs.value]))
    }

    const navigateToJob = (job) => {
      router.push(job.path)
    }

    const getCompanyInitial = (company) => {
      return company ? company.charAt(0).toUpperCase() : '?'
    }

    onMounted(() => {
      const saved = localStorage.getItem('savedJobs')
      if (saved) {
        savedJobs.value = new Set(JSON.parse(saved))
      }
    })

    return {
      searchQuery,
      filters,
      formattedMonth,
      filteredJobs,
      displayedJobs,
      hasMore,
      hasActiveFilters,
      savedJobs,
      handleSearch,
      clearSearch,
      resetFilters,
      loadMore,
      toggleSave,
      navigateToJob,
      getCompanyInitial
    }
  }
}
</script>

<style scoped>
.monthly-jobs-container {
  min-height: 100vh;
  background: var(--apple-bg-secondary, #F5F5F7);
}

/* Header with Glass Effect */
.jobs-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.logo-link {
  text-decoration: none;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: var(--apple-primary, #F97316);
  letter-spacing: -0.02em;
}

.tagline {
  font-size: 13px;
  color: var(--apple-text-secondary, #6E6E73);
  letter-spacing: -0.01em;
}

.header-nav {
  display: flex;
  gap: 28px;
  align-items: center;
}

.nav-link {
  color: var(--apple-text-primary, #1D1D1F);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s ease-out;
}

.nav-link:hover {
  color: var(--apple-primary, #F97316);
}

.nav-link--external .external-icon {
  opacity: 0.5;
}

/* Main Content */
.jobs-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 28px;
}

.page-title {
  font-size: 40px;
  font-weight: 700;
  color: var(--apple-text-primary, #1D1D1F);
  margin-bottom: 32px;
  letter-spacing: -0.03em;
}

/* Search Section */
.search-section {
  margin-bottom: 28px;
}

.search-wrapper {
  position: relative;
  margin-bottom: 18px;
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--apple-text-tertiary, #86868B);
}

.search-input {
  width: 100%;
  padding: 16px 52px;
  font-size: 16px;
  border: none;
  border-radius: var(--apple-radius-lg, 20px);
  background: var(--apple-bg-primary, #FFFFFF);
  color: var(--apple-text-primary, #1D1D1F);
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
  outline: none;
  transition: all 0.25s ease-out;
}

.search-input::placeholder {
  color: var(--apple-text-tertiary, #86868B);
}

.search-input:focus {
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.15);
}

.clear-search {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--apple-text-tertiary, #86868B);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease-out;
}

.clear-search:hover {
  background: var(--apple-bg-secondary, #F5F5F7);
  color: var(--apple-text-primary, #1D1D1F);
}

/* Filter Chips */
.filter-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: var(--apple-bg-primary, #FFFFFF);
  border: none;
  border-radius: var(--apple-radius-pill, 9999px);
  font-size: 14px;
  font-weight: 500;
  color: var(--apple-text-secondary, #6E6E73);
  cursor: pointer;
  transition: all 0.2s ease-out;
  box-shadow: var(--apple-shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.04));
}

.filter-chip:hover {
  color: var(--apple-text-primary, #1D1D1F);
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
}

.filter-chip.active {
  background: var(--apple-primary, #F97316);
  color: white;
}

/* Results Info */
.results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
}

.result-count {
  font-size: 15px;
  color: var(--apple-text-secondary, #6E6E73);
  font-weight: 500;
}

.reset-filters {
  background: none;
  border: none;
  color: var(--apple-primary, #F97316);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: var(--apple-radius-sm, 10px);
  transition: all 0.15s ease-out;
}

.reset-filters:hover {
  background: var(--apple-primary-subtle, #FFF7ED);
}

/* Job Cards Grid */
.job-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.job-card {
  background: var(--apple-bg-primary, #FFFFFF);
  border-radius: var(--apple-radius-lg, 20px);
  padding: 24px;
  cursor: pointer;
  transition: all 0.25s ease-out;
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
}

.job-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--apple-shadow-md, 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04));
}

.job-card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
}

.company-logo {
  width: 48px;
  height: 48px;
  border-radius: var(--apple-radius-md, 14px);
  background: var(--apple-bg-secondary, #F5F5F7);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.company-initial {
  font-size: 20px;
  font-weight: 600;
  color: var(--apple-primary, #F97316);
  letter-spacing: -0.02em;
}

.job-card-header-content {
  flex: 1;
  min-width: 0;
}

.job-position {
  font-size: 17px;
  font-weight: 600;
  color: var(--apple-text-primary, #1D1D1F);
  margin: 0 0 6px 0;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.job-company {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  flex-wrap: wrap;
}

.company-name {
  font-weight: 500;
  color: var(--apple-text-primary, #1D1D1F);
}

.location {
  color: var(--apple-text-secondary, #6E6E73);
}

.location::before {
  content: "";
  margin-right: 8px;
  opacity: 0.5;
}

.save-job {
  background: none;
  border: none;
  color: var(--apple-text-tertiary, #86868B);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--apple-radius-sm, 10px);
  transition: all 0.15s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-job:hover {
  color: var(--apple-primary, #F97316);
  background: var(--apple-primary-subtle, #FFF7ED);
}

.save-job.saved {
  color: var(--apple-primary, #F97316);
}

.save-job.saved svg {
  fill: var(--apple-primary, #F97316);
}

/* Job Tags */
.job-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.job-tag {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  background: var(--apple-bg-secondary, #F5F5F7);
  color: var(--apple-text-secondary, #6E6E73);
  border-radius: var(--apple-radius-pill, 9999px);
  letter-spacing: -0.01em;
}

.job-tag--salary {
  background: rgba(52, 199, 89, 0.12);
  color: #248A3D;
}

.job-tag--more {
  background: transparent;
  color: var(--apple-text-tertiary, #86868B);
  font-weight: 400;
}

/* Job Footer */
.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--apple-border-light, rgba(0, 0, 0, 0.06));
  font-size: 13px;
}

.hn-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--apple-primary, #F97316);
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: var(--apple-radius-sm, 10px);
  transition: all 0.15s ease-out;
}

.hn-link:hover {
  background: var(--apple-primary-subtle, #FFF7ED);
}

.posted-info {
  color: var(--apple-text-tertiary, #86868B);
}

/* Load More */
.load-more-section {
  text-align: center;
  margin: 48px 0;
}

.load-more-btn {
  padding: 16px 40px;
  background: var(--apple-bg-primary, #FFFFFF);
  color: var(--apple-text-primary, #1D1D1F);
  border: none;
  border-radius: var(--apple-radius-pill, 9999px);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease-out;
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
}

.load-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--apple-shadow-md, 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04));
}

/* No Results */
.no-results {
  text-align: center;
  padding: 80px 24px;
}

.no-results-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--apple-bg-primary, #FFFFFF);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
}

.no-results-icon {
  color: var(--apple-text-tertiary, #86868B);
}

.no-results h3 {
  font-size: 22px;
  font-weight: 600;
  color: var(--apple-text-primary, #1D1D1F);
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.no-results p {
  color: var(--apple-text-secondary, #6E6E73);
  margin-bottom: 28px;
  font-size: 15px;
}

.reset-btn {
  padding: 14px 32px;
  background: var(--apple-primary, #F97316);
  color: white;
  border: none;
  border-radius: var(--apple-radius-pill, 9999px);
  cursor: pointer;
  font-weight: 500;
  font-size: 15px;
  transition: all 0.25s ease-out;
}

.reset-btn:hover {
  background: var(--apple-primary-hover, #EA580C);
  transform: translateY(-2px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 14px 20px;
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
  }

  .logo-section {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .logo-text {
    font-size: 20px;
  }

  .tagline {
    font-size: 12px;
  }

  .header-nav {
    gap: 20px;
    width: 100%;
    justify-content: flex-start;
  }

  .nav-link {
    font-size: 13px;
  }

  .jobs-main {
    padding: 24px 20px;
  }

  .page-title {
    font-size: 28px;
    margin-bottom: 24px;
  }

  .search-input {
    padding: 14px 46px;
    font-size: 16px;
    border-radius: var(--apple-radius-md, 14px);
  }

  .search-icon {
    left: 16px;
  }

  .clear-search {
    right: 14px;
  }

  .filter-chips {
    gap: 8px;
  }

  .filter-chip {
    padding: 8px 14px;
    font-size: 13px;
  }

  .job-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .job-card {
    padding: 20px;
    border-radius: var(--apple-radius-md, 14px);
  }

  .company-logo {
    width: 44px;
    height: 44px;
  }

  .job-position {
    font-size: 16px;
  }

  .job-company {
    font-size: 13px;
  }

  .job-tag {
    font-size: 11px;
    padding: 5px 10px;
  }

  .job-footer {
    font-size: 12px;
  }
}

/* Dark Mode */
html.dark .jobs-header {
  background: rgba(28, 28, 30, 0.72);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
</style>
