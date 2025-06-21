<template>
  <article class="job-post" itemscope itemtype="https://schema.org/JobPosting">
    <header class="job-header">
      <div class="breadcrumb">
        <RouterLink to="/">Jobs</RouterLink>
        <i class="fas fa-chevron-right"></i>
        <span class="current-page">{{ company || title }}</span>
      </div>
      
      <div class="job-meta">
        <div class="company-info" v-if="company" itemprop="hiringOrganization" itemscope itemtype="https://schema.org/Organization">
          <h1 class="company-name" itemprop="name">{{ company }}</h1>
          <div class="job-title" itemprop="title">{{ jobTitle }}</div>
        </div>
        <div v-else>
          <h1 class="job-title" itemprop="title">{{ title }}</h1>
        </div>
        
        <div class="job-details">
          <div class="detail-item" v-if="location">
            <i class="fas fa-map-marker-alt"></i>
            <span itemprop="jobLocation" itemscope itemtype="https://schema.org/Place">
              <span itemprop="address">{{ location }}</span>
            </span>
          </div>
          
          <div class="detail-item" v-if="jobType">
            <i class="fas fa-briefcase"></i>
            <span itemprop="employmentType">{{ jobType }}</span>
          </div>
          
          <div class="detail-item" v-if="remote">
            <i class="fas fa-home"></i>
            <span>Remote</span>
          </div>
          
          <div class="detail-item" v-if="salary">
            <i class="fas fa-dollar-sign"></i>
            <span itemprop="baseSalary" itemscope itemtype="https://schema.org/MonetaryAmount">
              <span itemprop="value">{{ salary }}</span>
            </span>
          </div>
          
          <div class="detail-item">
            <i class="far fa-calendar"></i>
            <time :datetime="datePosted" itemprop="datePosted">{{ formatDate(datePosted) }}</time>
          </div>
        </div>
        
        <div class="job-tags" v-if="technologies && technologies.length">
          <span v-for="tech in technologies" :key="tech" class="tech-tag">
            {{ tech }}
          </span>
        </div>
      </div>
    </header>


    <div class="job-content" itemprop="description">
      <Content />
    </div>

    <footer class="job-footer">
      <div class="job-actions">
        <a 
          v-if="originalUrl" 
          :href="originalUrl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="btn btn-secondary"
        >
          <i class="fab fa-hacker-news"></i>
          View on Hacker News
        </a>
        
        <!-- Job application component will be rendered by content -->
      </div>
      
      <div class="job-share">
        <span class="share-label">Share this job:</span>
        <a 
          :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="share-btn twitter"
        >
          <i class="fab fa-twitter"></i>
        </a>
        <a 
          :href="`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="share-btn linkedin"
        >
          <i class="fab fa-linkedin"></i>
        </a>
        <button @click="copyLink" class="share-btn copy" :class="{ copied: linkCopied }">
          <i class="fas fa-link"></i>
        </button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { usePageFrontmatter, useSiteData } from '@vuepress/client'

const frontmatter = usePageFrontmatter()
const siteData = useSiteData()
const linkCopied = ref(false)

// Extract job information from frontmatter and content
const company = computed(() => frontmatter.value.company || extractCompanyFromTitle())
const jobTitle = computed(() => frontmatter.value.jobTitle || frontmatter.value.title)
const title = computed(() => frontmatter.value.title)
const location = computed(() => frontmatter.value.location || 'Not specified')
const jobType = computed(() => frontmatter.value.jobType || 'Full-time')
const remote = computed(() => frontmatter.value.remote || false)
const salary = computed(() => frontmatter.value.salary || '')
const technologies = computed(() => frontmatter.value.technologies || [])
const datePosted = computed(() => frontmatter.value.date || new Date().toISOString())
const originalUrl = computed(() => frontmatter.value.author?.url || '')
const description = computed(() => frontmatter.value.description || frontmatter.value.title)

const fullUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.href
  }
  return `${siteData.value.base}${frontmatter.value.path || ''}`
})

const shareText = computed(() => 
  `Check out this job: ${jobTitle.value} at ${company.value} - AngJobs`
)

function extractCompanyFromTitle(): string {
  const title = frontmatter.value.title || ''
  // Try to extract company name from title patterns
  const match = title.match(/^([^-]+)/)
  return match ? match[1].trim() : ''
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 1) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Add structured data to page head
onMounted(() => {
  if (typeof document !== 'undefined') {
    // Add structured data script to head
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": jobTitle.value || title.value,
      "description": description.value,
      "datePosted": datePosted.value,
      "hiringOrganization": {
        "@type": "Organization",
        "name": company.value || 'Unknown Company'
      },
      "jobLocation": {
        "@type": "Place",
        "address": location.value || 'Not specified'
      },
      "employmentType": jobType.value || 'FULL_TIME',
      "url": fullUrl.value
    })
    document.head.appendChild(script)
    
    // Cleanup on unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }
})

async function copyLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(fullUrl.value)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}
</script>

<style lang="scss">
.job-post {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--bg-color);
  
  .job-header {
    margin-bottom: 2rem;
    
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      color: var(--text-color-secondary);
      
      a {
        color: var(--theme-color);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      i {
        font-size: 0.75rem;
      }
      
      .current-page {
        font-weight: 500;
        color: var(--text-color);
      }
    }
  }
  
  .job-meta {
    .company-info {
      margin-bottom: 1rem;
      
      .company-name {
        font-size: 2rem;
        font-weight: 800;
        margin: 0 0 0.5rem;
        color: var(--text-color);
      }
      
      .job-title {
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--text-color-secondary);
      }
    }
    
    .job-title {
      font-size: 2rem;
      font-weight: 800;
      margin: 0 0 1rem;
      color: var(--text-color);
    }
    
    .job-details {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      
      .detail-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-color-secondary);
        
        i {
          width: 16px;
          color: var(--theme-color);
        }
      }
    }
    
    .job-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      
      .tech-tag {
        padding: 0.375rem 0.75rem;
        background: rgba(33, 150, 243, 0.1);
        color: #2196F3;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
      }
    }
  }
  
  .job-content {
    line-height: 1.7;
    margin-bottom: 3rem;
    
    h2, h3, h4 {
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    
    p {
      margin-bottom: 1rem;
    }
    
    a {
      color: var(--theme-color);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .job-footer {
    border-top: 1px solid var(--border-color);
    padding-top: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    
    .job-actions {
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;
        
        &.btn-secondary {
          background: var(--bg-color-secondary);
          color: var(--text-color);
          border: 1px solid var(--border-color);
          
          &:hover {
            border-color: var(--theme-color);
            color: var(--theme-color);
          }
        }
      }
    }
    
    .job-share {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .share-label {
        font-size: 0.9rem;
        color: var(--text-color-secondary);
      }
      
      .share-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--bg-color-secondary);
        color: var(--text-color-secondary);
        text-decoration: none;
        border: 1px solid var(--border-color);
        transition: all 0.2s ease;
        cursor: pointer;
        
        &:hover {
          transform: translateY(-2px);
        }
        
        &.twitter:hover {
          background: #1DA1F2;
          color: white;
          border-color: #1DA1F2;
        }
        
        &.linkedin:hover {
          background: #0A66C2;
          color: white;
          border-color: #0A66C2;
        }
        
        &.copy:hover {
          background: var(--theme-color);
          color: white;
          border-color: var(--theme-color);
        }
        
        &.copied {
          background: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }
      }
    }
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .job-post {
    padding: 1rem;
    
    .job-header {
      .job-meta {
        .company-info .company-name,
        .job-title {
          font-size: 1.5rem;
        }
        
        .job-details {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }
      }
    }
    
    .job-footer {
      flex-direction: column;
      align-items: stretch;
      
      .job-share {
        justify-content: center;
      }
    }
  }
}

/* Dark mode support */
html.dark {
  .job-post {
    background: var(--bg-color-secondary);
  }
}
</style>