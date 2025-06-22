<template>
  <div class="job-listing-wrapper">
    <!-- Instant search bar -->
    <div class="search-bar-sticky">
      <div class="search-container">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search jobs instantly..."
          class="search-input"
          @input="handleSearch"
        />
        <div class="search-stats">
          <span v-if="searchQuery">{{ filteredCount }} of {{ totalJobs }} jobs</span>
        </div>
      </div>
    </div>

    <!-- Job list content -->
    <div class="job-list-content">
      <slot :filtered-count="filteredCount" :search-query="searchQuery"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JobListingSimple',
  data() {
    return {
      searchQuery: '',
      totalJobs: 0,
      filteredCount: 0
    }
  },
  methods: {
    handleSearch() {
      // Filter all job items based on search
      const jobItems = document.querySelectorAll('.job-list-item');
      let count = 0;
      
      jobItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const query = this.searchQuery.toLowerCase();
        
        if (!query || text.includes(query)) {
          item.style.display = '';
          count++;
        } else {
          item.style.display = 'none';
        }
      });
      
      this.filteredCount = count;
      
      // Update no results message
      const noResults = document.querySelector('.no-results-message');
      if (noResults) {
        noResults.style.display = count === 0 && this.searchQuery ? 'block' : 'none';
      }
    }
  },
  mounted() {
    // Count total jobs
    const jobItems = document.querySelectorAll('.job-list-item');
    this.totalJobs = jobItems.length;
    this.filteredCount = jobItems.length;
    
    // Add instant highlighting
    this.$watch('searchQuery', (query) => {
      if (!query) {
        // Remove all highlights
        document.querySelectorAll('.highlight').forEach(el => {
          el.outerHTML = el.innerHTML;
        });
        return;
      }
      
      // Add highlighting (optional enhancement)
      // Implementation depends on specific needs
    });
  }
}
</script>

<style scoped>
.job-listing-wrapper {
  position: relative;
}

.search-bar-sticky {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 0;
  margin-bottom: 24px;
}

.search-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 32px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 14px 20px 14px 56px;
  font-size: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  outline: none;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-input:focus {
  border-color: #ff6600;
  box-shadow: 0 2px 12px rgba(255, 102, 0, 0.15);
}

.search-stats {
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
}

.job-list-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}

/* Global styles for job items */
:global(.job-list-item) {
  transition: all 0.3s ease;
}

:global(.job-list-item[style*="display: none"]) {
  display: none !important;
}

:global(.no-results-message) {
  text-align: center;
  padding: 48px 24px;
  color: #666;
  display: none;
}

:global(.highlight) {
  background: #fff3cd;
  padding: 2px 4px;
  border-radius: 3px;
}

@media (max-width: 768px) {
  .search-bar-sticky {
    padding: 12px 0;
    margin-bottom: 16px;
  }
  
  .search-input {
    padding: 12px 16px 12px 48px;
    font-size: 16px;
  }
  
  .search-icon {
    left: 28px;
  }
  
  .search-stats {
    font-size: 12px;
    right: 28px;
  }
}
</style>