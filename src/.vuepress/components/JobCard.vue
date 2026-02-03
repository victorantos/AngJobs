<template>
  <article
    class="job-card"
    :class="{ 'job-card--featured': featured }"
    @click="handleClick"
  >
    <div class="job-card__header">
      <div class="job-card__company-info">
        <div class="job-card__company-logo">
          <img v-if="companyLogo" :src="companyLogo" :alt="`${company} logo`" />
          <span v-else class="job-card__company-initial">{{ companyInitial }}</span>
        </div>
        <div class="job-card__company-text">
          <h3 class="job-card__company">{{ company }}</h3>
          <p class="job-card__location" v-if="location">
            <svg class="location-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {{ location }}
          </p>
        </div>
      </div>
      <div class="job-card__date">
        <svg class="calendar-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        {{ formatDate(date) }}
      </div>
    </div>

    <h2 class="job-card__title">{{ title }}</h2>

    <div class="job-card__tags">
      <span v-if="jobType" class="job-tag job-tag--type">
        {{ jobType }}
      </span>
      <span v-if="remote" class="job-tag job-tag--remote">
        Remote
      </span>
      <span v-if="salary" class="job-tag job-tag--salary">
        {{ salary }}
      </span>
      <span v-for="tech in displayedTechnologies" :key="tech" class="job-tag job-tag--tech">
        {{ tech }}
      </span>
      <span v-if="technologies && technologies.length > 3" class="job-tag job-tag--more">
        +{{ technologies.length - 3 }}
      </span>
    </div>

    <p class="job-card__description">{{ truncateDescription(description) }}</p>

    <div class="job-card__footer">
      <RouterLink
        :to="link"
        class="job-card__view-link"
        @click.stop
      >
        View Role
        <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </RouterLink>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  company: string
  companyLogo?: string
  title: string
  location: string
  date: string
  jobType?: string
  remote?: boolean
  salary?: string
  technologies?: string[]
  description: string
  link: string
  featured?: boolean
}

const props = defineProps<Props>()

const companyInitial = computed(() => {
  return props.company ? props.company.charAt(0).toUpperCase() : '?'
})

const displayedTechnologies = computed(() => {
  return props.technologies ? props.technologies.slice(0, 3) : []
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const truncateDescription = (text: string, maxLength: number = 140) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

const handleClick = () => {
  if (typeof window !== 'undefined') {
    window.location.href = props.link
  }
}
</script>

<style lang="scss">
.job-card {
  background: var(--apple-bg-primary, #FFFFFF);
  border-radius: var(--apple-radius-lg, 20px);
  padding: 24px;
  transition: var(--apple-transition, all 0.25s ease-out);
  cursor: pointer;
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
  border: none;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--apple-shadow-md, 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04));
  }

  &--featured {
    background: linear-gradient(135deg, var(--apple-bg-primary) 0%, var(--apple-primary-subtle, #FFF7ED) 100%);
    box-shadow: var(--apple-shadow-md, 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04));
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__company-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__company-logo {
    width: 48px;
    height: 48px;
    border-radius: var(--apple-radius-md, 14px);
    overflow: hidden;
    background: var(--apple-bg-secondary, #F5F5F7);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__company-initial {
    font-size: 20px;
    font-weight: 600;
    color: var(--apple-primary, #F97316);
    letter-spacing: -0.02em;
  }

  &__company {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
    color: var(--apple-text-primary, #1D1D1F);
    letter-spacing: -0.01em;
  }

  &__location {
    font-size: 13px;
    color: var(--apple-text-secondary, #6E6E73);
    margin: 4px 0 0;
    display: flex;
    align-items: center;
    gap: 4px;

    .location-icon {
      opacity: 0.7;
    }
  }

  &__date {
    font-size: 13px;
    color: var(--apple-text-tertiary, #86868B);
    display: flex;
    align-items: center;
    gap: 5px;

    .calendar-icon {
      opacity: 0.6;
    }
  }

  &__title {
    font-size: 19px;
    font-weight: 600;
    margin: 0 0 14px;
    color: var(--apple-text-primary, #1D1D1F);
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }

  &__description {
    color: var(--apple-text-secondary, #6E6E73);
    font-size: 15px;
    line-height: 1.55;
    margin-bottom: 20px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
  }

  &__view-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--apple-primary, #F97316);
    font-weight: 500;
    font-size: 15px;
    text-decoration: none;
    transition: var(--apple-transition-fast, all 0.15s ease-out);

    .arrow-icon {
      transition: transform 0.2s ease-out;
    }

    &:hover {
      color: var(--apple-primary-hover, #EA580C);

      .arrow-icon {
        transform: translateX(4px);
      }
    }
  }
}

.job-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--apple-radius-pill, 9999px);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.01em;

  &--type {
    background: var(--apple-bg-secondary, #F5F5F7);
    color: var(--apple-text-secondary, #6E6E73);
  }

  &--remote {
    background: rgba(52, 199, 89, 0.12);
    color: #248A3D;
  }

  &--salary {
    background: rgba(255, 159, 10, 0.12);
    color: #C93400;
  }

  &--tech {
    background: var(--apple-bg-secondary, #F5F5F7);
    color: var(--apple-text-secondary, #6E6E73);
  }

  &--more {
    background: var(--apple-bg-secondary, #F5F5F7);
    color: var(--apple-text-tertiary, #86868B);
    font-weight: 400;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .job-card {
    padding: 20px;
    border-radius: var(--apple-radius-md, 14px);

    &__header {
      flex-direction: column;
      gap: 10px;
    }

    &__company-info {
      width: 100%;
    }

    &__date {
      width: 100%;
    }

    &__company-logo {
      width: 44px;
      height: 44px;
    }

    &__title {
      font-size: 17px;
    }

    &__tags {
      gap: 6px;
    }

    &__description {
      font-size: 14px;
    }
  }

  .job-tag {
    font-size: 11px;
    padding: 5px 10px;
  }
}

/* Dark mode support */
html.dark {
  .job-card {
    background: var(--apple-bg-secondary, #2C2C2E);

    &:hover {
      box-shadow: var(--apple-shadow-md);
    }

    &--featured {
      background: linear-gradient(135deg, var(--apple-bg-secondary) 0%, rgba(249, 115, 22, 0.08) 100%);
    }
  }

  .job-tag {
    &--remote {
      background: rgba(52, 199, 89, 0.15);
      color: #30D158;
    }

    &--salary {
      background: rgba(255, 159, 10, 0.15);
      color: #FF9F0A;
    }
  }
}
</style>
