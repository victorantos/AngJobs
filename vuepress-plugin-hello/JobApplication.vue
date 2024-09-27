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
  
        // Submission to a server
        // Gather form data
  const formData = {
    name: this.name,    // Replace with actual form fields
    email: this.email,  // Replace with actual form fields
    resume: this.resume,
    text: this.message
  };

    // Send POST request to the API
    fetch('https://victorantos-api.azurewebsites.net/jobapplicationsfromangjobs', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
        .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Assuming the API responds with JSON
        })
        .then(data => {
        // Handle successful form submission
        this.formSubmitted = true;
        this.isSubmitting = false;
        this.resetForm();
        console.log('Form successfully submitted:', data);
        })
        .catch(error => {
        // Handle errors in form submission
        this.isSubmitting = false;
        console.error('There was an error submitting the form:', error);
        });
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
    padding: 12px 15px; /* Even padding on left and right */
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    background-color: #f9f9f9;
    box-sizing: border-box; /* Ensures padding is inside the input box */
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
 
@media (max-width: 600px) {
  .form-container {
    padding: 20px; /* Reduce padding on smaller screens */
  }
}
</style>