<template>
  <div class="job-listing-container">
    <div class="job-listing-header">
      <h1 class="listing-title">{{ monthYear }} Jobs</h1>
      <div class="job-stats">
        <span class="job-count">{{ filteredJobs.length }} positions</span>
        <span class="last-updated">Updated {{ lastUpdated }}</span>
      </div>
    </div>

    <div class="search-container">
      <input 
        v-model="searchQuery"
        type="text"
        placeholder="Search jobs, companies, locations..."
        class="search-input"
        @input="handleSearch"
      />
      <div class="filter-chips">
        <button 
          v-for="filter in filters"
          :key="filter"
          :class="['filter-chip', { active: activeFilters.includes(filter) }]"
          @click="toggleFilter(filter)"
        >
          {{ filter }}
        </button>
      </div>
    </div>

    <div class="job-list">
      <article 
        v-for="(job, index) in paginatedJobs" 
        :key="job.path"
        class="job-item"
        :class="{ 'job-item-alt': index % 2 === 1 }"
      >
        <div class="job-number">{{ startIndex + index + 1 }}.</div>
        <div class="job-content">
          <h2 class="job-title">
            <a :href="job.path" class="job-link">{{ job.title }}</a>
          </h2>
          <div class="job-meta">
            <span class="company">{{ job.company }}</span>
            <span class="separator">•</span>
            <span class="location">{{ job.location || 'Remote' }}</span>
            <span class="separator">•</span>
            <span class="job-type">{{ job.type || 'Full-time' }}</span>
          </div>
          <div class="job-tags">
            <span v-for="tag in job.tags" :key="tag" class="job-tag">{{ tag }}</span>
          </div>
          <div class="job-actions">
            <a :href="job.hnUrl" target="_blank" class="hn-link" title="View on Hacker News">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13.73 15.51L17.21 8h2.05l-4.81 9.51V24h-1.92v-6.49L7.72 8h2.05l3.48 7.51z"/>
              </svg>
              HN
            </a>
            <span class="posted-by">by {{ job.author }}</span>
            <span class="post-time">{{ job.timeAgo }}</span>
          </div>
        </div>
      </article>

      <div v-if="filteredJobs.length === 0" class="no-results">
        <p>No jobs found matching your criteria.</p>
        <button @click="clearFilters" class="clear-filters-btn">Clear filters</button>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JobListing',
  props: {
    jobs: {
      type: Array,
      default: () => []
    },
    monthYear: {
      type: String,
      default: 'Current Month'
    }
  },
  data() {
    return {
      searchQuery: '',
      activeFilters: [],
      currentPage: 1,
      itemsPerPage: 30,
      filters: ['Remote', 'Onsite', 'Hybrid', 'Senior', 'Junior', 'Full-time', 'Part-time', 'Contract'],
      lastUpdated: 'recently'
    }
  },
  computed: {
    filteredJobs() {
      let jobs = this.jobs;
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          (job.location && job.location.toLowerCase().includes(query)) ||
          (job.tags && job.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      }
      
      if (this.activeFilters.length > 0) {
        jobs = jobs.filter(job => {
          return this.activeFilters.some(filter => {
            const filterLower = filter.toLowerCase();
            return job.title.toLowerCase().includes(filterLower) ||
                   (job.location && job.location.toLowerCase().includes(filterLower)) ||
                   (job.type && job.type.toLowerCase().includes(filterLower)) ||
                   (job.tags && job.tags.some(tag => tag.toLowerCase().includes(filterLower)));
          });
        });
      }
      
      return jobs;
    },
    paginatedJobs() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredJobs.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredJobs.length / this.itemsPerPage);
    },
    startIndex() {
      return (this.currentPage - 1) * this.itemsPerPage;
    }
  },
  methods: {
    handleSearch() {
      this.currentPage = 1;
    },
    toggleFilter(filter) {
      const index = this.activeFilters.indexOf(filter);
      if (index > -1) {
        this.activeFilters.splice(index, 1);
      } else {
        this.activeFilters.push(filter);
      }
      this.currentPage = 1;
    },
    clearFilters() {
      this.searchQuery = '';
      this.activeFilters = [];
      this.currentPage = 1;
    },
    parseJobFromMarkdown(content, path, frontmatter) {
      const company = frontmatter.title.split(' : ')[0] || 'Unknown Company';
      const jobTitle = frontmatter.title.split(' : ')[1] || frontmatter.title;
      
      const locationMatch = content.match(/(?:Remote|Onsite|Hybrid|REMOTE|ONSITE)(?:\s*\([^)]+\))?/i);
      const location = locationMatch ? locationMatch[0] : null;
      
      const typeMatch = content.match(/(?:Full-time|Part-time|Contract|Freelance|Internship)/i);
      const type = typeMatch ? typeMatch[0] : null;
      
      const tags = [];
      const techStack = content.match(/(?:React|Vue|Angular|Node|Python|Java|Go|Rust|TypeScript|JavaScript|AWS|Docker|Kubernetes|Machine Learning|AI|DevOps)/gi);
      if (techStack) {
        tags.push(...[...new Set(techStack.slice(0, 5))]);
      }
      
      return {
        path: path.replace('.md', ''),
        title: jobTitle,
        company,
        location,
        type,
        tags,
        author: frontmatter.author?.name || 'Unknown',
        hnUrl: frontmatter.author?.url || '#',
        timeAgo: '1d'
      };
    }
  },
  mounted() {
    const now = new Date();
    const options = { month: 'short', day: 'numeric' };
    this.lastUpdated = now.toLocaleDateString('en-US', options);
  }
}
</script>

<style scoped>
.job-listing-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.job-listing-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 16px;
}

.listing-title {
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.job-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.search-container {
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #ff6600;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.filter-chip {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  border-color: #ff6600;
  color: #ff6600;
}

.filter-chip.active {
  background: #ff6600;
  border-color: #ff6600;
  color: #fff;
}

.job-list {
  background: #f6f6ef;
  border-radius: 8px;
  padding: 8px;
}

.job-item {
  display: flex;
  padding: 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.job-item:hover {
  background-color: rgba(255, 102, 0, 0.05);
}

.job-item-alt {
  background-color: rgba(0, 0, 0, 0.02);
}

.job-number {
  flex-shrink: 0;
  width: 30px;
  font-size: 14px;
  color: #666;
  padding-top: 2px;
}

.job-content {
  flex: 1;
  min-width: 0;
}

.job-title {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.4;
}

.job-link {
  color: #1a1a1a;
  text-decoration: none;
}

.job-link:hover {
  text-decoration: underline;
}

.job-link:visited {
  color: #666;
}

.job-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.separator {
  color: #ccc;
}

.job-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.job-tag {
  padding: 2px 8px;
  font-size: 11px;
  background: #e8f4ff;
  color: #0066cc;
  border-radius: 12px;
}

.job-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #828282;
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

.no-results {
  text-align: center;
  padding: 48px 24px;
  color: #666;
}

.clear-filters-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #ff6600;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.clear-filters-btn:hover {
  background: #e55500;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px;
}

.page-btn {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #ff6600;
  color: #ff6600;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .job-listing-container {
    padding: 12px;
  }
  
  .listing-title {
    font-size: 20px;
  }
  
  .job-stats {
    font-size: 12px;
  }
  
  .search-input {
    font-size: 16px;
  }
  
  .filter-chips {
    gap: 6px;
  }
  
  .filter-chip {
    padding: 4px 10px;
    font-size: 12px;
  }
  
  .job-item {
    padding: 10px;
  }
  
  .job-number {
    width: 24px;
    font-size: 12px;
  }
  
  .job-title {
    font-size: 15px;
  }
  
  .job-meta {
    font-size: 12px;
  }
  
  .job-actions {
    font-size: 11px;
  }
  
  .pagination {
    gap: 12px;
  }
}
</style>