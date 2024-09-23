<template>
    <div class="form-container">
      <h1>Apply for the Job</h1>
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            v-model="form.fullName"
            required
          />
        </div>
  
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            required
          />
        </div>
  
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            v-model="form.phone"
            required
          />
        </div>
  
        <div class="form-group">
          <label for="resume">Resume (PDF)</label>
          <input
            type="file"
            id="resume"
            @change="handleFileUpload"
            accept=".pdf"
            required
          />
        </div>
  
        <div class="form-group">
          <label for="message">Message</label>
          <textarea
            id="message"
            v-model="form.message"
            rows="5"
            placeholder="Tell us about yourself..."
          ></textarea>
        </div>
  
        <div class="form-group">
          <button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>
  
        <div v-if="formSubmitted" class="form-success">
          Thank you! Your application has been submitted.
        </div>
      </form>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        form: {
          fullName: '',
          email: '',
          phone: '',
          resume: null,
          message: '',
        },
        isSubmitting: false,
        formSubmitted: false,
      };
    },
    methods: {
      handleFileUpload(event) {
        this.form.resume = event.target.files[0];
      },
      submitForm() {
        if (!this.validateForm()) {
          alert('Please fill in all required fields.');
          return;
        }
  
        this.isSubmitting = true;
  
        // Simulate form submission to a server
        setTimeout(() => {
          this.formSubmitted = true;
          this.isSubmitting = false;
          this.resetForm();
        }, 1500); // Simulate network delay
      },
      validateForm() {
        return (
          this.form.fullName &&
          this.form.email &&
          this.form.phone &&
          this.form.resume
        );
      },
      resetForm() {
        this.form = {
          fullName: '',
          email: '',
          phone: '',
          resume: null,
          message: '',
        };
      },
    },
  };
  </script>
  
  <style scoped>
  body {
    font-family: 'Poppins', sans-serif;
    background-color: #f7f8fc;
    color: #333;
    padding: 20px;
  }
  h1 {
    text-align: center;
    font-weight: 600;
    color: #2c3e50;
  }
  .form-container {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }
  .form-group {
    margin-bottom: 20px;
  }
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #34495e;
  }
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    background-color: #f9f9f9;
    transition: border 0.3s;
  }
  .form-group input:focus,
  .form-group textarea:focus {
    border-color: #3498db;
    outline: none;
  }
  .form-group button {
    width: 100%;
    background-color: #3498db;
    color: white;
    border: none;
    padding: 12px;
    font-size: 18px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  .form-group button:hover {
    background-color: #2980b9;
  }
  .form-group button:disabled {
    background-color: #95a5a6;
  }
  .form-success {
    display: block;
    color: #27ae60;
    text-align: center;
    font-size: 18px;
    margin-top: 20px;
    font-weight: 600;
  }
  </style>