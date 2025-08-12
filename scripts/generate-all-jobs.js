import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const jobsDir = path.resolve('src/jobs');

// Automatically detect available month directories
const months = fs.readdirSync(jobsDir)
  .filter(item => {
    const fullPath = path.join(jobsDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           item.match(/^[A-Za-z]+-20\d{2}$/) && // Match format like "August-2025"
           item !== 'README'; // Exclude non-month directories
  })
  .sort((a, b) => {
    // Sort by year first, then by month (newest first)
    const [monthA, yearA] = a.split('-');
    const [monthB, yearB] = b.split('-');
    if (yearA !== yearB) return yearB.localeCompare(yearA);
    
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    return monthOrder.indexOf(monthB) - monthOrder.indexOf(monthA);
  });

console.log('Detected months:', months);

// Function to generate featured jobs for month overview page
function generateFeaturedJobs(month, jobs) {
  // Randomly select 10 jobs
  const shuffled = [...jobs].sort(() => 0.5 - Math.random());
  const featuredJobs = shuffled.slice(0, Math.min(10, jobs.length));
  
  const monthFormatted = month.replace('-', ' ');
  const monthDir = path.join(jobsDir, month);
  const readmePath = path.join(monthDir, 'README.md');
  
  // Read existing README
  let readmeContent = '';
  if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  } else {
    // Create basic README structure if it doesn't exist
    readmeContent = `---
title: ${monthFormatted} Jobs
icon: briefcase
index: true
dir:
  order: -1
  collapsible: false
---

# ${monthFormatted} Jobs

<div class="jobs-header">
  <div class="jobs-count">${jobs.length} positions available</div>
  <a href="./all-jobs.md" class="search-all-button">🔍 Search All Jobs</a>
</div>
`;
  }
  
  // Add featured jobs section
  const featuredSection = `
## ⭐ Featured Jobs

<div class="featured-jobs">
${featuredJobs.map(job => `  <div class="featured-job">
    <h3><a href="${job.url}">${job.title}</a></h3>
    <div class="job-meta">
      <span class="company">🏢 ${job.company}</span>
      <span class="author">👤 ${job.author}</span>
    </div>
  </div>`).join('\n')}
</div>
`;

  // Check if featured jobs section already exists and replace it
  const featuredRegex = /## ⭐ Featured Jobs[\s\S]*?(?=##|$)/;
  if (featuredRegex.test(readmeContent)) {
    readmeContent = readmeContent.replace(featuredRegex, featuredSection.trim());
  } else {
    // Add featured jobs section after the header, ensure proper spacing
    if (!readmeContent.endsWith('\n')) {
      readmeContent += '\n';
    }
    readmeContent += featuredSection;
  }
  
  // Write updated README
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Generated ${featuredJobs.length} featured jobs for ${month} overview`);
}

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
      
      // Create a clean URL from the filename, handling malformed filenames
      const cleanFilename = file
        .replace('.md', '')
        .replace(/\n/g, '') // Remove newlines
        .replace(/\r/g, '') // Remove carriage returns
        .trim();

      return {
        title: cleanTitle,
        url: `/jobs/${month}/${encodeURIComponent(cleanFilename)}`,
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

<div class="jobs-header">
  <div class="jobs-count">${jobs.length} total positions</div>
  <div class="back-link">
    <a href="/jobs/${month}/">&larr; Back to Featured Jobs</a>
  </div>
</div>

<AllJobsSearch />

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

  // Generate featured jobs for month overview README
  generateFeaturedJobs(month, jobs);
});

console.log('All job listing pages generated successfully!');