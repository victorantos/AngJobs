import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const jobsDir = '/Users/victora/RiderProjects/AngJobs/src/jobs';
const months = ['June-2025', 'May-2025', 'April-2025'];

months.forEach(month => {
  const monthDir = path.join(jobsDir, month);
  const files = fs.readdirSync(monthDir).filter(file => 
    file.endsWith('.md') && 
    !file.includes('index.md') && 
    !file.includes('README.md')
  );

  const jobs = files.map(file => {
    try {
      const filePath = path.join(monthDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter } = matter(content);
      
      // Clean title for display
      const cleanTitle = frontmatter.title
        ?.replace(/<[^>]*>/g, '')
        ?.replace(/&[^;]+;/g, '')
        ?.replace(/[<>$]/g, '')
        ?.trim() || 'Job Listing';

      // Extract job info from filename
      const parts = file.replace('.md', '').split('-');
      const company = parts.slice(1, 2).join('-') || 'Company';
      const role = parts.slice(2, 4).join(' ') || 'Role';
      
      return {
        title: cleanTitle,
        url: `/jobs/${month}/${file.replace('.md', '')}`,
        company,
        role,
        author: frontmatter.author?.name || 'Anonymous'
      };
    } catch (error) {
      console.warn(`Error processing ${file}:`, error.message);
      return null;
    }
  }).filter(Boolean);

  // Sort jobs alphabetically
  jobs.sort((a, b) => a.title.localeCompare(b.title));

  // Generate all-jobs page
  const allJobsContent = `---
title: All ${month.replace('-', ' ')} Jobs
---

<div class="all-jobs-page">

# All ${month.replace('-', ' ')} Jobs

<div class="jobs-header">
  <div class="jobs-count">${jobs.length} total positions</div>
  <div class="back-link">
    <a href="/jobs/${month}/">&larr; Back to Featured Jobs</a>
  </div>
</div>

<div class="jobs-search">
  <input type="text" id="jobSearch" placeholder="Search jobs..." />
  <div class="search-results-count">
    <span id="searchCount">${jobs.length}</span> jobs found
  </div>
</div>

<div class="jobs-grid">
${jobs.map(job => `
  <div class="job-item" data-title="${job.title.toLowerCase()}" data-company="${job.company.toLowerCase()}">
    <div class="job-content">
      <h3><a href="${job.url}">${job.title}</a></h3>
      <div class="job-meta">
        <span class="company">🏢 ${job.company}</span>
        <span class="author">👤 ${job.author}</span>
      </div>
    </div>
  </div>
`).join('')}
</div>

</div>

<script>
// Simple search functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('jobSearch');
  const searchCount = document.getElementById('searchCount');
  const jobItems = document.querySelectorAll('.job-item');
  
  searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    let visibleCount = 0;
    
    jobItems.forEach(item => {
      const title = item.dataset.title;
      const company = item.dataset.company;
      
      if (!query || title.includes(query) || company.includes(query)) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });
    
    searchCount.textContent = visibleCount;
  });
});
</script>

<style>
.all-jobs-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.jobs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--angjobs-primary, #ff6600);
}

.jobs-count {
  font-size: 18px;
  font-weight: 600;
  color: var(--angjobs-text-primary, #1a1a1a);
}

.back-link a {
  color: var(--angjobs-primary, #ff6600);
  text-decoration: none;
  font-weight: 500;
}

.back-link a:hover {
  text-decoration: underline;
}

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

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.job-item {
  background: var(--angjobs-bg-main, #f6f6ef);
  border: 1px solid var(--angjobs-border, #e5e7eb);
  border-radius: var(--angjobs-border-radius, 8px);
  padding: 20px;
  transition: var(--angjobs-transition, all 0.2s ease);
}

.job-item:hover {
  background: #fff;
  border-color: var(--angjobs-primary, #ff6600);
  box-shadow: var(--angjobs-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
  transform: translateY(-2px);
}

.job-content h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.job-content h3 a {
  color: var(--angjobs-text-primary, #1a1a1a);
  text-decoration: none;
}

.job-content h3 a:hover {
  color: var(--angjobs-primary, #ff6600);
}

.job-content h3 a:visited {
  color: var(--angjobs-text-secondary, #666);
}

.job-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
}

.job-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--angjobs-text-secondary, #666);
}

.company {
  font-weight: 500;
  color: #374151 !important;
}

@media (max-width: 768px) {
  .all-jobs-page {
    padding: 0 16px;
  }
  
  .jobs-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .jobs-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .job-item {
    padding: 16px;
  }
  
  .job-content h3 {
    font-size: 16px;
  }
  
  .job-meta {
    font-size: 13px;
    gap: 12px;
  }
}
</style>
`;

  // Write the all-jobs page
  const allJobsPath = path.join(monthDir, 'all-jobs.md');
  fs.writeFileSync(allJobsPath, allJobsContent);
  console.log(`Generated all-jobs page for ${month}: ${jobs.length} jobs`);
});

console.log('All job listing pages generated successfully!');