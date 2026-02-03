<template>
  <div class="monthly-jobs-container">
    <!-- Header -->
    <header class="jobs-header">
      <div class="header-content">
        <div class="logo-section">
          <a href="/" class="logo-link">
            <span class="logo-text">AngJobs</span>
          </a>
          <span class="tagline">Hacker News Job Board</span>
        </div>
        <nav class="header-nav">
          <a href="/" class="nav-link">Home</a>
          <a href="/jobs/" class="nav-link">All Jobs</a>
          <a href="https://news.ycombinator.com/item?id=whoishiring" target="_blank" class="nav-link external">
            Submit Job
            <svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="filter-section">
            <div class="filter-group">
              <label class="filter-label">Type</label>
              <div class="filter-options">
                <label class="filter-option">
                  <input type="checkbox" v-model="filters.remote" />
                  <span>Remote</span>
                </label>
                <label class="filter-option">
                  <input type="checkbox" v-model="filters.onsite" />
                  <span>Onsite</span>
                </label>
                <label class="filter-option">
                  <input type="checkbox" v-model="filters.hybrid" />
                  <span>Hybrid</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Job Count -->
        <div class="results-info">
          <span class="result-count">{{ filteredJobs.length }} jobs found</span>
          <button v-if="hasActiveFilters" @click="resetFilters" class="reset-filters">
            Reset filters
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
              <h2 class="job-position">{{ job.position }}</h2>
              <button class="save-job" @click.stop="toggleSave(job)" :class="{ saved: job.saved }">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>
            
            <div class="job-company">
              <span class="company-name">{{ job.company }}</span>
              <span v-if="job.location" class="location">{{ job.location }}</span>
            </div>
            
            <div class="job-details">
              <span v-if="job.type" class="job-type">{{ job.type }}</span>
              <span v-if="job.salary" class="salary">{{ job.salary }}</span>
            </div>
            
            <div class="job-tags">
              <span v-for="tag in job.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
            
            <div class="job-footer">
              <a :href="job.hnUrl" @click.stop class="hn-link" target="_blank">
                View on HN
                <svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
              <span class="posted-info">by {{ job.author }} • {{ job.timeAgo }}</span>
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
          <svg class="no-results-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
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
      // Persist to localStorage
      localStorage.setItem('savedJobs', JSON.stringify([...savedJobs.value]))
    }
    
    const navigateToJob = (job) => {
      router.push(job.path)
    }
    
    onMounted(() => {
      // Load saved jobs from localStorage
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
      navigateToJob
    }
  }
}
</script>

<style scoped>
.monthly-jobs-container {
  min-height: 100vh;
  background: #f8f9fa;
}

/* Header */
.jobs-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.logo-link {
  text-decoration: none;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #ff6600;
}

.tagline {
  font-size: 14px;
  color: #6b7280;
}

.header-nav {
  display: flex;
  gap: 24px;
  align-items: center;
}

.nav-link {
  color: #374151;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link:hover {
  color: #ff6600;
}

.external-icon {
  opacity: 0.5;
}

/* Main Content */
.jobs-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 24px;
}

/* Search Section */
.search-section {
  margin-bottom: 24px;
}

.search-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 12px 48px;
  font-size: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: #ff6600;
  box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
}

.clear-search {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
}

.clear-search:hover {
  color: #6b7280;
}

/* Filters */
.filter-section {
  display: flex;
  gap: 24px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}

.filter-options {
  display: flex;
  gap: 16px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.filter-option input[type="checkbox"] {
  cursor: pointer;
}

/* Results Info */
.results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.result-count {
  font-size: 14px;
  color: #6b7280;
}

.reset-filters {
  background: none;
  border: none;
  color: #ff6600;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.reset-filters:hover {
  text-decoration: underline;
}

/* Job Cards */
.job-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  margin-bottom: 48px;
}

.job-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.job-card:hover {
  border-color: #ff6600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.job-card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.job-position {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
  line-height: 1.3;
}

.save-job {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.save-job:hover {
  color: #ff6600;
}

.save-job.saved {
  color: #ff6600;
}

.save-job.saved svg {
  fill: #ff6600;
}

.job-company {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 15px;
}

.company-name {
  font-weight: 500;
  color: #374151;
}

.location {
  color: #6b7280;
}

.location::before {
  content: "•";
  margin-right: 8px;
}

.job-details {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #6b7280;
}

.job-type {
  padding: 4px 8px;
  background: #f3f4f6;
  border-radius: 4px;
}

.salary {
  font-weight: 500;
  color: #059669;
}

.job-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.tag {
  padding: 4px 10px;
  font-size: 12px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 16px;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  font-size: 13px;
}

.hn-link {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ff6600;
  text-decoration: none;
  font-weight: 500;
}

.hn-link:hover {
  text-decoration: underline;
}

.posted-info {
  color: #9ca3af;
}

/* Load More */
.load-more-section {
  text-align: center;
  margin: 48px 0;
}

.load-more-btn {
  padding: 12px 32px;
  background: #ff6600;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.load-more-btn:hover {
  background: #e55500;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 64px 24px;
}

.no-results-icon {
  color: #e5e7eb;
  margin-bottom: 24px;
}

.no-results h3 {
  font-size: 20px;
  color: #374151;
  margin-bottom: 8px;
}

.no-results p {
  color: #6b7280;
  margin-bottom: 24px;
}

.reset-btn {
  padding: 10px 24px;
  background: #ff6600;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.reset-btn:hover {
  background: #e55500;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 12px 16px;
  }
  
  .logo-section {
    flex-direction: column;
    gap: 4px;
  }
  
  .logo-text {
    font-size: 20px;
  }
  
  .tagline {
    font-size: 12px;
  }
  
  .header-nav {
    gap: 16px;
  }
  
  .nav-link {
    font-size: 13px;
  }
  
  .jobs-main {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .search-input {
    padding: 10px 40px;
    font-size: 16px;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 16px;
  }
  
  .job-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .job-card {
    padding: 16px;
  }
  
  .job-position {
    font-size: 16px;
  }
  
  .job-company {
    font-size: 14px;
  }
  
  .job-details {
    font-size: 13px;
  }
  
  .tag {
    font-size: 11px;
  }
  
  .job-footer {
    font-size: 12px;
  }
}
</style>