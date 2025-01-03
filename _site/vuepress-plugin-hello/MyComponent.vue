<template>
    <div>
      <!-- Button to open the modal -->
      <button @click="openModal">Open Modal</button>
  
      <!-- Modal -->
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <p>{{ message }}</p>
          <button @click="closeModal">OK</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  
  export default {
    name: 'MyComponent',
    setup() {
      // Reactive state for modal visibility
      const isModalOpen = ref(false);
      
      // Message to show in the modal
      const message = ref('This is your modal message.');
  
      // Open modal function
      const openModal = () => {
        isModalOpen.value = true;
      };
  
      // Close modal function
      const closeModal = () => {
        isModalOpen.value = false;
      };
  
      return {
        isModalOpen,
        message,
        openModal,
        closeModal
      };
    }
  };
  </script>
  
  <style scoped>
  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    width: 300px;
  }
  
  button {
    margin-top: 20px;
    padding: 10px 20px;
  }
  </style>