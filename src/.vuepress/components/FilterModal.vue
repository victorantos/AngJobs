<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="filter-modal-overlay" @click="close">
        <div class="filter-modal" @click.stop>
          <header class="modal-header">
            <h2 class="modal-title">
              <i class="fas fa-filter"></i>
              Filter Jobs
            </h2>
            <button @click="close" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </header>

          <div class="modal-content">
            <div class="filter-section">
              <h3 class="filter-title">
                <i class="fas fa-map-marker-alt"></i>
                Location
              </h3>
              <div class="filter-grid">
                <label 
                  v-for="location in locations" 
                  :key="location"
                  class="filter-checkbox"
                >
                  <input
                    type="checkbox"
                    :value="location"
                    v-model="localSelectedLocations"
                  />
                  <span class="checkbox-label">{{ location }}</span>
                  <span class="checkbox-count">({{ getLocationCount(location) }})</span>
                </label>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">
                <i class="fas fa-briefcase"></i>
                Job Type
              </h3>
              <div class="filter-grid">
                <label 
                  v-for="type in jobTypes" 
                  :key="type"
                  class="filter-checkbox"
                >
                  <input
                    type="checkbox"
                    :value="type"
                    v-model="localSelectedJobTypes"
                  />
                  <span class="checkbox-label">{{ type }}</span>
                  <span class="checkbox-count">({{ getJobTypeCount(type) }})</span>
                </label>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">
                <i class="fas fa-home"></i>
                Work Style
              </h3>
              <div class="filter-grid">
                <label class="filter-checkbox">
                  <input
                    type="checkbox"
                    v-model="localRemoteOnly"
                  />
                  <span class="checkbox-label">Remote Only</span>
                  <span class="checkbox-count">({{ getRemoteCount() }})</span>
                </label>
              </div>
            </div>

            <div class="filter-section">
              <h3 class="filter-title">
                <i class="fas fa-code"></i>
                Technologies
              </h3>
              <div class="tech-filter-container">
                <div class="tech-search">
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
                    <span class="tech-count">({{ getTechCount(tech) }})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer class="modal-footer">
            <div class="filter-summary">
              <span class="results-count">
                {{ filteredJobsCount }} jobs match your filters
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

// Local state for filters
const localSelectedLocations = ref([...props.selectedLocations])
const localSelectedJobTypes = ref([...props.selectedJobTypes])
const localSelectedTechnologies = ref([...props.selectedTechnologies])
const localRemoteOnly = ref(props.remoteOnly)
const techSearchQuery = ref('')

// Watch for prop changes to sync local state
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

// Computed properties
const filteredTechnologies = computed(() => {
  if (!techSearchQuery.value) return props.technologies
  
  const query = techSearchQuery.value.toLowerCase()
  return props.technologies.filter(tech => 
    tech.toLowerCase().includes(query)
  )
})

const filteredJobsCount = computed(() => {
  // This would need to be calculated based on current filters
  // For now, return total job count
  return props.jobCounts.total
})

// Methods
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

// Handle ESC key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close()
  }
}

// Add/remove event listener for ESC key
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.filter-modal {
  background: var(--bg-color);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  
  .modal-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    
    i {
      color: var(--theme-color);
    }
  }
  
  .close-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: var(--bg-color-secondary);
      border-color: var(--text-color);
      color: var(--text-color);
    }
  }
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.filter-section {
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .filter-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-color);
    
    i {
      color: var(--theme-color);
      width: 16px;
    }
  }
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-color-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--theme-color);
    background: rgba(33, 150, 243, 0.05);
  }
  
  input[type="checkbox"] {
    cursor: pointer;
    accent-color: var(--theme-color);
  }
  
  .checkbox-label {
    flex: 1;
    font-size: 0.9rem;
    color: var(--text-color);
  }
  
  .checkbox-count {
    font-size: 0.8rem;
    color: var(--text-color-secondary);
    font-weight: 500;
  }
}

.tech-filter-container {
  .tech-search {
    margin-bottom: 1rem;
    
    .tech-search-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-color-secondary);
      color: var(--text-color);
      font-size: 0.9rem;
      
      &:focus {
        outline: none;
        border-color: var(--theme-color);
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
      }
      
      &::placeholder {
        color: var(--text-color-secondary);
      }
    }
  }
  
  .tech-tags-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
    
    .tech-filter-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-color-secondary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--theme-color);
        color: var(--theme-color);
      }
      
      &.active {
        background: var(--theme-color);
        border-color: var(--theme-color);
        color: white;
      }
      
      .tech-count {
        font-size: 0.75rem;
        opacity: 0.8;
      }
    }
  }
}

.modal-footer {
  border-top: 1px solid var(--border-color);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  
  .filter-summary {
    .results-count {
      font-size: 0.9rem;
      color: var(--text-color-secondary);
      font-weight: 500;
    }
  }
  
  .modal-actions {
    display: flex;
    gap: 0.75rem;
    
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      
      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-color-secondary);
        
        &:hover {
          border-color: var(--text-color);
          color: var(--text-color);
        }
      }
      
      &.btn-primary {
        background: var(--theme-color);
        color: white;
        
        &:hover {
          background: var(--theme-color-dark);
          transform: translateY(-1px);
        }
      }
    }
  }
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .filter-modal-overlay {
    align-items: flex-end;
    padding: 0;
  }
  
  .filter-modal {
    border-radius: 12px 12px 0 0;
    max-height: 85vh;
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

/* Dark mode support */
html.dark {
  .filter-modal {
    background: var(--bg-color-secondary);
    border: 1px solid var(--border-color);
  }
}

/* Custom scrollbar */
.modal-content::-webkit-scrollbar,
.tech-tags-grid::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track,
.tech-tags-grid::-webkit-scrollbar-track {
  background: var(--bg-color-secondary);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb,
.tech-tags-grid::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
  
  &:hover {
    background: var(--text-color-secondary);
  }
}
</style>