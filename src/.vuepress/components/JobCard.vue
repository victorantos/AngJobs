<template>
  <article 
    class="job-card"
    :class="{ 'job-card--featured': featured }"
    @click="handleClick"
  >
    <div class="job-card__header">
      <div class="job-card__company-info">
        <div class="job-card__company-logo" v-if="companyLogo">
          <img :src="companyLogo" :alt="`${company} logo`" />
        </div>
        <div class="job-card__company-text">
          <h3 class="job-card__company">{{ company }}</h3>
          <p class="job-card__location">
            <i class="fas fa-map-marker-alt"></i>
            {{ location }}
          </p>
        </div>
      </div>
      <div class="job-card__date">
        <i class="far fa-calendar"></i>
        {{ formatDate(date) }}
      </div>
    </div>

    <h2 class="job-card__title">{{ title }}</h2>

    <div class="job-card__tags">
      <span v-if="jobType" class="job-tag job-tag--type">
        <i class="fas fa-briefcase"></i>
        {{ jobType }}
      </span>
      <span v-if="remote" class="job-tag job-tag--remote">
        <i class="fas fa-home"></i>
        Remote
      </span>
      <span v-if="salary" class="job-tag job-tag--salary">
        <i class="fas fa-dollar-sign"></i>
        {{ salary }}
      </span>
      <span v-for="tech in technologies" :key="tech" class="job-tag job-tag--tech">
        {{ tech }}
      </span>
    </div>

    <p class="job-card__description">{{ truncateDescription(description) }}</p>

    <div class="job-card__footer">
      <RouterLink 
        :to="link" 
        class="job-card__apply-btn"
        @click.stop
      >
        View Details
        <i class="fas fa-arrow-right"></i>
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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 1) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const truncateDescription = (text: string, maxLength: number = 150) => {
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
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--theme-color);
  }
  
  &--featured {
    border-color: var(--theme-color);
    background: linear-gradient(135deg, var(--bg-color-secondary) 0%, var(--bg-color) 100%);
  }
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  &__company-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  &__company-logo {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--bg-color);
    display: flex;
    align-items: center;
    justify-content: center;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  
  &__company {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-color);
  }
  
  &__location {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    margin: 0.25rem 0 0;
    
    i {
      margin-right: 0.25rem;
    }
  }
  
  &__date {
    font-size: 0.85rem;
    color: var(--text-color-secondary);
    
    i {
      margin-right: 0.25rem;
    }
  }
  
  &__title {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 1rem;
    color: var(--text-color);
    line-height: 1.3;
  }
  
  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  &__description {
    color: var(--text-color-secondary);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
  
  &__footer {
    display: flex;
    justify-content: flex-end;
  }
  
  &__apply-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem;
    background: var(--theme-color);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--theme-color-dark);
      transform: translateX(2px);
    }
    
    i {
      font-size: 0.875rem;
      transition: transform 0.2s ease;
    }
    
    &:hover i {
      transform: translateX(3px);
    }
  }
}

.job-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  
  &--type {
    background: rgba(33, 150, 243, 0.1);
    color: #2196F3;
  }
  
  &--remote {
    background: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }
  
  &--salary {
    background: rgba(255, 193, 7, 0.1);
    color: #FFC107;
  }
  
  &--tech {
    background: var(--bg-color);
    color: var(--text-color-secondary);
    border: 1px solid var(--border-color);
  }
}

/* Mobile-first responsive design */
@media (max-width: 768px) {
  .job-card {
    padding: 1.25rem;
    
    &__header {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    &__company-info {
      width: 100%;
    }
    
    &__date {
      width: 100%;
    }
    
    &__title {
      font-size: 1.1rem;
    }
    
    &__tags {
      gap: 0.375rem;
    }
    
    &__description {
      font-size: 0.95rem;
    }
  }
  
  .job-tag {
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
  }
}

/* Dark mode support */
html.dark {
  .job-card {
    background: var(--bg-color-secondary);
    
    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    
    &--featured {
      background: linear-gradient(135deg, var(--bg-color-secondary) 0%, rgba(33, 150, 243, 0.05) 100%);
    }
  }
}
</style>