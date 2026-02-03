<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="filter-modal-overlay" @click="close">
        <div class="filter-modal" @click.stop>
          <header class="modal-header">
            <h2 class="modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filter Jobs
            </h2>
            <button @click="close" class="close-btn" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>

          <div class="modal-content">
            <div class="filter-section">
              <h3 class="filter-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Location
              </h3>
              <div class="filter-grid">
                <label
                  v-for="location in locations"
                  :key="location"
                  class="filter-checkbox"
                  :class="{ active: localSelectedLocations.includes(location) }"
                >
                  <input
                    type="checkbox"
                    :value="location"
                    v-model="localSelectedLocations"
                  />
                  <span class="checkbox-label">{{ location }}</span>
                  <span class="checkbox-count">{{ getLocationCount(location) }}</span>
                </label>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                Job Type
              </h3>
              <div class="filter-grid">
                <label
                  v-for="type in jobTypes"
                  :key="type"
                  class="filter-checkbox"
                  :class="{ active: localSelectedJobTypes.includes(type) }"
                >
                  <input
                    type="checkbox"
                    :value="type"
                    v-model="localSelectedJobTypes"
                  />
                  <span class="checkbox-label">{{ type }}</span>
                  <span class="checkbox-count">{{ getJobTypeCount(type) }}</span>
                </label>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Work Style
              </h3>
              <div class="filter-grid">
                <label class="filter-checkbox" :class="{ active: localRemoteOnly }">
                  <input
                    type="checkbox"
                    v-model="localRemoteOnly"
                  />
                  <span class="checkbox-label">Remote Only</span>
                  <span class="checkbox-count">{{ getRemoteCount() }}</span>
                </label>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                Technologies
              </h3>
              <div class="tech-filter-container">
                <div class="tech-search">
                  <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    v-model="techSearchQuery"
                    type="text"
                    placeholder="Search technologies..."
                    class="tech-search-input"
                  />
                </div>
                <div class="tech-tags-grid">
                  <button
                    v-for="tech in filteredTechnologies"
                    :key="tech"
                    class="tech-filter-tag"
                    :class="{ active: localSelectedTechnologies.includes(tech) }"
                    @click="toggleTechnology(tech)"
                  >
                    {{ tech }}
                    <span class="tech-count">{{ getTechCount(tech) }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer class="modal-footer">
            <div class="filter-summary">
              <span class="results-count">
                {{ filteredJobsCount }} jobs match
              </span>
            </div>
            <div class="modal-actions">
              <button @click="clearAll" class="btn btn-outline">
                Clear All
              </button>
              <button @click="applyFilters" class="btn btn-primary">
                Apply Filters
              </button>
            </div>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  isOpen: boolean
  locations: string[]
  jobTypes: string[]
  technologies: string[]
  selectedLocations: string[]
  selectedJobTypes: string[]
  selectedTechnologies: string[]
  remoteOnly: boolean
  jobCounts: {
    locations: Record<string, number>
    jobTypes: Record<string, number>
    technologies: Record<string, number>
    remote: number
    total: number
  }
}

interface Emits {
  (e: 'close'): void
  (e: 'apply', filters: {
    locations: string[]
    jobTypes: string[]
    technologies: string[]
    remoteOnly: boolean
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localSelectedLocations = ref([...props.selectedLocations])
const localSelectedJobTypes = ref([...props.selectedJobTypes])
const localSelectedTechnologies = ref([...props.selectedTechnologies])
const localRemoteOnly = ref(props.remoteOnly)
const techSearchQuery = ref('')

watch(() => props.selectedLocations, (newVal) => {
  localSelectedLocations.value = [...newVal]
})

watch(() => props.selectedJobTypes, (newVal) => {
  localSelectedJobTypes.value = [...newVal]
})

watch(() => props.selectedTechnologies, (newVal) => {
  localSelectedTechnologies.value = [...newVal]
})

watch(() => props.remoteOnly, (newVal) => {
  localRemoteOnly.value = newVal
})

const filteredTechnologies = computed(() => {
  if (!techSearchQuery.value) return props.technologies

  const query = techSearchQuery.value.toLowerCase()
  return props.technologies.filter(tech =>
    tech.toLowerCase().includes(query)
  )
})

const filteredJobsCount = computed(() => {
  return props.jobCounts.total
})

const close = () => {
  emit('close')
}

const applyFilters = () => {
  emit('apply', {
    locations: localSelectedLocations.value,
    jobTypes: localSelectedJobTypes.value,
    technologies: localSelectedTechnologies.value,
    remoteOnly: localRemoteOnly.value
  })
  close()
}

const clearAll = () => {
  localSelectedLocations.value = []
  localSelectedJobTypes.value = []
  localSelectedTechnologies.value = []
  localRemoteOnly.value = false
}

const toggleTechnology = (tech: string) => {
  const index = localSelectedTechnologies.value.indexOf(tech)
  if (index > -1) {
    localSelectedTechnologies.value.splice(index, 1)
  } else {
    localSelectedTechnologies.value.push(tech)
  }
}

const getLocationCount = (location: string) => {
  return props.jobCounts.locations[location] || 0
}

const getJobTypeCount = (jobType: string) => {
  return props.jobCounts.jobTypes[jobType] || 0
}

const getTechCount = (tech: string) => {
  return props.jobCounts.technologies[tech] || 0
}

const getRemoteCount = () => {
  return props.jobCounts.remote || 0
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})
</script>

<style lang="scss">
.filter-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.filter-modal {
  background: var(--apple-bg-primary, #FFFFFF);
  border-radius: var(--apple-radius-xl, 24px);
  box-shadow: var(--apple-shadow-xl, 0 8px 24px rgba(0, 0, 0, 0.10), 0 16px 48px rgba(0, 0, 0, 0.08));
  width: 100%;
  max-width: 580px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 1px solid var(--apple-border-light, rgba(0, 0, 0, 0.08));

  .modal-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--apple-text-primary, #1D1D1F);
    letter-spacing: -0.02em;

    svg {
      color: var(--apple-primary, #F97316);
    }
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--apple-radius-pill, 9999px);
    background: var(--apple-bg-secondary, #F5F5F7);
    border: none;
    color: var(--apple-text-secondary, #6E6E73);
    cursor: pointer;
    transition: all 0.2s ease-out;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: var(--apple-border-light, rgba(0, 0, 0, 0.08));
      color: var(--apple-text-primary, #1D1D1F);
    }
  }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.filter-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }

  .filter-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--apple-text-primary, #1D1D1F);
    letter-spacing: -0.01em;

    svg {
      color: var(--apple-text-secondary, #6E6E73);
    }
  }
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--apple-bg-secondary, #F5F5F7);
  border-radius: var(--apple-radius-md, 14px);
  cursor: pointer;
  transition: all 0.2s ease-out;
  border: 2px solid transparent;

  &:hover {
    background: var(--apple-bg-tertiary, #FAFAFA);
  }

  &.active {
    background: var(--apple-primary-subtle, #FFF7ED);
    border-color: var(--apple-primary, #F97316);
  }

  input[type="checkbox"] {
    display: none;
  }

  .checkbox-label {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: var(--apple-text-primary, #1D1D1F);
  }

  .checkbox-count {
    font-size: 13px;
    color: var(--apple-text-tertiary, #86868B);
    font-weight: 500;
    background: var(--apple-bg-primary, #FFFFFF);
    padding: 2px 8px;
    border-radius: var(--apple-radius-pill, 9999px);
  }

  &.active .checkbox-count {
    background: var(--apple-primary, #F97316);
    color: white;
  }
}

.tech-filter-container {
  .tech-search {
    position: relative;
    margin-bottom: 16px;

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--apple-text-tertiary, #86868B);
    }

    .tech-search-input {
      width: 100%;
      padding: 12px 14px 12px 42px;
      border: none;
      border-radius: var(--apple-radius-md, 14px);
      background: var(--apple-bg-secondary, #F5F5F7);
      color: var(--apple-text-primary, #1D1D1F);
      font-size: 15px;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.15);
      }

      &::placeholder {
        color: var(--apple-text-tertiary, #86868B);
      }
    }
  }

  .tech-tags-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-height: 180px;
    overflow-y: auto;
    padding: 4px;

    .tech-filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--apple-bg-secondary, #F5F5F7);
      border: none;
      border-radius: var(--apple-radius-pill, 9999px);
      font-size: 13px;
      font-weight: 500;
      color: var(--apple-text-secondary, #6E6E73);
      cursor: pointer;
      transition: all 0.2s ease-out;

      &:hover {
        background: var(--apple-bg-tertiary, #FAFAFA);
        color: var(--apple-text-primary, #1D1D1F);
      }

      &.active {
        background: var(--apple-primary, #F97316);
        color: white;
      }

      .tech-count {
        font-size: 11px;
        opacity: 0.7;
      }
    }
  }
}

.modal-footer {
  border-top: 1px solid var(--apple-border-light, rgba(0, 0, 0, 0.08));
  padding: 20px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  .filter-summary {
    .results-count {
      font-size: 14px;
      color: var(--apple-text-secondary, #6E6E73);
      font-weight: 500;
    }
  }

  .modal-actions {
    display: flex;
    gap: 12px;

    .btn {
      padding: 12px 24px;
      border-radius: var(--apple-radius-pill, 9999px);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.25s ease-out;
      border: none;

      &.btn-outline {
        background: var(--apple-bg-secondary, #F5F5F7);
        color: var(--apple-text-secondary, #6E6E73);

        &:hover {
          background: var(--apple-border-light, rgba(0, 0, 0, 0.08));
          color: var(--apple-text-primary, #1D1D1F);
        }
      }

      &.btn-primary {
        background: var(--apple-primary, #F97316);
        color: white;

        &:hover {
          background: var(--apple-primary-hover, #EA580C);
          transform: translateY(-1px);
        }
      }
    }
  }
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease-out;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .filter-modal,
.modal-leave-to .filter-modal {
  transform: scale(0.95) translateY(20px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .filter-modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .filter-modal {
    border-radius: var(--apple-radius-xl, 24px) var(--apple-radius-xl, 24px) 0 0;
    max-height: 90vh;
  }

  .modal-header,
  .modal-content,
  .modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
    align-items: stretch;

    .modal-actions {
      width: 100%;

      .btn {
        flex: 1;
      }
    }
  }
}

/* Dark mode */
html.dark {
  .filter-modal {
    background: var(--apple-bg-secondary, #2C2C2E);
  }

  .filter-checkbox {
    background: var(--apple-bg-tertiary, #3A3A3C);

    &:hover {
      background: var(--apple-bg-primary, #1C1C1E);
    }

    .checkbox-count {
      background: var(--apple-bg-secondary, #2C2C2E);
    }
  }

  .tech-search-input,
  .tech-filter-tag {
    background: var(--apple-bg-tertiary, #3A3A3C);
  }
}

/* Custom scrollbar */
.modal-content::-webkit-scrollbar,
.tech-tags-grid::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track,
.tech-tags-grid::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb,
.tech-tags-grid::-webkit-scrollbar-thumb {
  background: var(--apple-border-light, rgba(0, 0, 0, 0.08));
  border-radius: 3px;

  &:hover {
    background: var(--apple-text-tertiary, #86868B);
  }
}
</style>
