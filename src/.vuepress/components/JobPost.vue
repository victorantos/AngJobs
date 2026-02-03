<template>
  <article class="job-post" itemscope itemtype="https://schema.org/JobPosting">
    <header class="job-header">
      <div class="breadcrumb">
        <RouterLink to="/" class="breadcrumb-link">Jobs</RouterLink>
        <svg class="breadcrumb-separator" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <span class="breadcrumb-current">{{ company || title }}</span>
      </div>

      <div class="job-meta">
        <div class="company-hero" v-if="company" itemprop="hiringOrganization" itemscope itemtype="https://schema.org/Organization">
          <div class="company-logo">
            <span class="company-initial">{{ companyInitial }}</span>
          </div>
          <div class="company-text">
            <h1 class="company-name" itemprop="name">{{ company }}</h1>
            <div class="job-title-display" itemprop="title">{{ jobTitle }}</div>
          </div>
        </div>
        <div v-else>
          <h1 class="job-title-hero" itemprop="title">{{ title }}</h1>
        </div>

        <div class="job-details-grid">
          <div class="detail-card" v-if="location">
            <div class="detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="detail-content">
              <span class="detail-label">Location</span>
              <span class="detail-value" itemprop="jobLocation" itemscope itemtype="https://schema.org/Place">
                <span itemprop="address">{{ location }}</span>
              </span>
            </div>
          </div>

          <div class="detail-card" v-if="jobType">
            <div class="detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div class="detail-content">
              <span class="detail-label">Employment</span>
              <span class="detail-value" itemprop="employmentType">{{ jobType }}</span>
            </div>
          </div>

          <div class="detail-card" v-if="remote">
            <div class="detail-icon detail-icon--remote">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div class="detail-content">
              <span class="detail-label">Work Style</span>
              <span class="detail-value">Remote</span>
            </div>
          </div>

          <div class="detail-card" v-if="salary">
            <div class="detail-icon detail-icon--salary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="detail-content">
              <span class="detail-label">Salary</span>
              <span class="detail-value" itemprop="baseSalary" itemscope itemtype="https://schema.org/MonetaryAmount">
                <span itemprop="value">{{ salary }}</span>
              </span>
            </div>
          </div>

          <div class="detail-card">
            <div class="detail-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="detail-content">
              <span class="detail-label">Posted</span>
              <time class="detail-value" :datetime="datePosted" itemprop="datePosted">{{ formatDate(datePosted) }}</time>
            </div>
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
          class="action-btn action-btn--secondary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434h-.056s-.297-.689-.654-1.434L8.717 5.896H6.951z"/>
          </svg>
          View on Hacker News
        </a>
      </div>

      <div class="job-share">
        <span class="share-label">Share</span>
        <a
          :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="share-btn"
          title="Share on Twitter"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <a
          :href="`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`"
          target="_blank"
          rel="noopener noreferrer"
          class="share-btn"
          title="Share on LinkedIn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        <button @click="copyLink" class="share-btn" :class="{ copied: linkCopied }" title="Copy link">
          <svg v-if="!linkCopied" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
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

const companyInitial = computed(() => {
  return company.value ? company.value.charAt(0).toUpperCase() : '?'
})

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

onMounted(() => {
  if (typeof document !== 'undefined') {
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
  padding: 40px 32px;
  background: var(--apple-bg-primary, #FFFFFF);

  .job-header {
    margin-bottom: 40px;

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
      font-size: 14px;

      &-link {
        color: var(--apple-primary, #F97316);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      &-separator {
        color: var(--apple-text-tertiary, #86868B);
      }

      &-current {
        font-weight: 500;
        color: var(--apple-text-secondary, #6E6E73);
      }
    }
  }

  .job-meta {
    .company-hero {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;

      .company-logo {
        width: 72px;
        height: 72px;
        border-radius: var(--apple-radius-lg, 20px);
        background: var(--apple-bg-secondary, #F5F5F7);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .company-initial {
          font-size: 32px;
          font-weight: 600;
          color: var(--apple-primary, #F97316);
          letter-spacing: -0.03em;
        }
      }

      .company-text {
        .company-name {
          font-size: 48px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--apple-text-primary, #1D1D1F);
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .job-title-display {
          font-size: 20px;
          font-weight: 400;
          color: var(--apple-text-secondary, #6E6E73);
          letter-spacing: -0.01em;
        }
      }
    }

    .job-title-hero {
      font-size: 48px;
      font-weight: 700;
      margin: 0 0 32px;
      color: var(--apple-text-primary, #1D1D1F);
      letter-spacing: -0.03em;
      line-height: 1.1;
    }

    .job-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 28px;

      .detail-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 18px 20px;
        background: var(--apple-bg-secondary, #F5F5F7);
        border-radius: var(--apple-radius-md, 14px);

        .detail-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--apple-radius-sm, 10px);
          background: var(--apple-bg-primary, #FFFFFF);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--apple-text-secondary, #6E6E73);

          &--remote {
            color: #34C759;
          }

          &--salary {
            color: var(--apple-primary, #F97316);
          }
        }

        .detail-content {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .detail-label {
            font-size: 12px;
            font-weight: 500;
            color: var(--apple-text-tertiary, #86868B);
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }

          .detail-value {
            font-size: 15px;
            font-weight: 500;
            color: var(--apple-text-primary, #1D1D1F);
          }
        }
      }
    }

    .job-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .tech-tag {
        padding: 8px 16px;
        background: var(--apple-bg-secondary, #F5F5F7);
        color: var(--apple-text-secondary, #6E6E73);
        border-radius: var(--apple-radius-pill, 9999px);
        font-size: 14px;
        font-weight: 500;
        letter-spacing: -0.01em;
      }
    }
  }

  .job-content {
    font-size: 17px;
    line-height: 1.7;
    color: var(--apple-text-primary, #1D1D1F);
    margin-bottom: 48px;

    h2, h3, h4 {
      margin-top: 40px;
      margin-bottom: 16px;
      letter-spacing: -0.02em;
    }

    h2 {
      font-size: 24px;
    }

    h3 {
      font-size: 20px;
    }

    p {
      margin-bottom: 20px;
    }

    ul, ol {
      margin-bottom: 20px;
      padding-left: 24px;

      li {
        margin-bottom: 8px;
      }
    }

    a {
      color: var(--apple-primary, #F97316);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    code {
      background: var(--apple-bg-secondary, #F5F5F7);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }
  }

  .job-footer {
    padding-top: 32px;
    border-top: 1px solid var(--apple-border-light, rgba(0, 0, 0, 0.08));
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;

    .job-actions {
      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 24px;
        border-radius: var(--apple-radius-pill, 9999px);
        text-decoration: none;
        font-weight: 500;
        font-size: 15px;
        transition: var(--apple-transition, all 0.25s ease-out);

        &--secondary {
          background: var(--apple-bg-secondary, #F5F5F7);
          color: var(--apple-text-primary, #1D1D1F);

          &:hover {
            background: var(--apple-border-light, rgba(0, 0, 0, 0.08));
            transform: translateY(-2px);
          }
        }
      }
    }

    .job-share {
      display: flex;
      align-items: center;
      gap: 12px;

      .share-label {
        font-size: 14px;
        color: var(--apple-text-secondary, #6E6E73);
        font-weight: 500;
      }

      .share-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: var(--apple-radius-pill, 9999px);
        background: var(--apple-bg-secondary, #F5F5F7);
        color: var(--apple-text-secondary, #6E6E73);
        text-decoration: none;
        border: none;
        transition: var(--apple-transition, all 0.25s ease-out);
        cursor: pointer;

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--apple-shadow-sm);
        }

        &:nth-child(2):hover {
          background: #1D9BF0;
          color: white;
        }

        &:nth-child(3):hover {
          background: #0A66C2;
          color: white;
        }

        &:nth-child(4):hover {
          background: var(--apple-primary, #F97316);
          color: white;
        }

        &.copied {
          background: #34C759;
          color: white;
        }
      }
    }
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .job-post {
    padding: 24px 20px;

    .job-header {
      margin-bottom: 32px;

      .breadcrumb {
        margin-bottom: 24px;
        font-size: 13px;
      }

      .job-meta {
        .company-hero {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;

          .company-logo {
            width: 60px;
            height: 60px;

            .company-initial {
              font-size: 26px;
            }
          }

          .company-text {
            .company-name {
              font-size: 32px;
            }

            .job-title-display {
              font-size: 17px;
            }
          }
        }

        .job-title-hero {
          font-size: 32px;
          margin-bottom: 24px;
        }

        .job-details-grid {
          grid-template-columns: 1fr;
          gap: 12px;

          .detail-card {
            padding: 14px 16px;
          }
        }
      }
    }

    .job-content {
      font-size: 16px;

      h2 {
        font-size: 22px;
      }

      h3 {
        font-size: 18px;
      }
    }

    .job-footer {
      flex-direction: column;
      align-items: stretch;

      .job-actions {
        .action-btn {
          width: 100%;
          justify-content: center;
        }
      }

      .job-share {
        justify-content: center;
      }
    }
  }
}

/* Dark mode support */
html.dark {
  .job-post {
    background: var(--apple-bg-secondary, #2C2C2E);
  }
}
</style>
