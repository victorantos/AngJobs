<template>
    <div class="promo-section">
      <a href="https://muz11.com" target="_blank" class="promo-card promo-muz11">
        <img src="/muz11-icon.png" alt="Muz11" class="promo-icon" />
        <div class="promo-text">
          <strong>Need focus music?</strong>
          <span>Muz11 — 100+ curated playlists for coding</span>
        </div>
      </a>
      <a href="https://sneos.com" target="_blank" class="promo-card promo-sneos">
        <img src="/sneos-icon.svg" alt="Sneos" class="promo-icon" />
        <div class="promo-text">
          <strong>Compare AI models?</strong>
          <span>Sneos — Chat with multiple AIs side by side</span>
        </div>
      </a>
    </div>

    <div class="form-container">
      <h2 class="form-title">Apply for this Job</h2>
      <p class="form-subtitle">Your application will be forwarded to the hiring contact.</p>
      <form @submit.prevent="submitForm">
        <div class="form-row">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              v-model="form.fullName"
              placeholder="John Doe"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              v-model="form.email"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="phone">Phone <span class="optional">(optional)</span></label>
            <input
              type="tel"
              id="phone"
              v-model="form.phone"
              placeholder="+1 555 123 4567"
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
        </div>

        <div class="form-group">
          <label for="message">Cover Note <span class="optional">(optional)</span></label>
          <textarea
            id="message"
            v-model="form.message"
            rows="4"
            placeholder="Brief introduction..."
          ></textarea>
        </div>

        <div class="form-group">
          <button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Sending...' : 'Send Application' }}
          </button>
        </div>

        <div v-if="formSubmitted" class="form-success">
          Application sent! The hiring contact will receive your details.
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
        const formData = new FormData();
        formData.append("name", this.form.fullName);
        formData.append("email", this.form.email);
        formData.append("resume", this.form.resume);
        formData.append("text", this.form.message);
        formData.append("url", document.URL);
        formData.append("title", document.title);
        formData.append("source", this.$page.frontmatter.author.url);
        formData.append("author", this.$page.frontmatter.author.name);

   
        // Send POST request to the API
        fetch('https://victorantos-api.azurewebsites.net/jobapplicationsfromangjobs', {
            method: 'POST',
            body: formData,
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
  .promo-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    max-width: 600px;
    margin: 32px auto 0;
  }

  .promo-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 8px;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .promo-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .promo-muz11 {
    background: linear-gradient(135deg, #667eea11 0%, #764ba211 100%);
    border: 1px solid #667eea22;
  }

  .promo-muz11 strong { color: #667eea; }
  .promo-muz11:hover { border-color: #667eea44; }

  .promo-codorex {
    background: linear-gradient(135deg, #4CAF5011 0%, #2196F311 100%);
    border: 1px solid #4CAF5022;
  }

  .promo-codorex strong { color: #4CAF50; }
  .promo-codorex:hover { border-color: #4CAF5044; }

  .promo-sneos {
    background: linear-gradient(135deg, #3b82f611 0%, #9333ea11 100%);
    border: 1px solid #3b82f622;
  }

  .promo-sneos strong { color: #3b82f6; }
  .promo-sneos:hover { border-color: #9333ea44; }

  .promo-icon {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .promo-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .promo-text strong {
    font-size: 13px;
    font-weight: 600;
  }

  .promo-text span {
    font-size: 11px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 600px) {
    .promo-section {
      grid-template-columns: 1fr;
      margin: 24px 0 0 0;
      padding: 0 16px;
    }

    .promo-text span {
      white-space: normal;
    }
  }

  .form-container {
    max-width: 600px;
    margin: 16px auto 0;
    background: #f6f6ef;
    padding: 24px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .form-title {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .form-subtitle {
    margin: 0 0 20px 0;
    font-size: 14px;
    color: #666;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    font-size: 14px;
    color: #374151;
  }

  .form-group .optional {
    font-weight: 400;
    color: #9ca3af;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 16px;
    background-color: #fff;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: #9ca3af;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    border-color: #ff6600;
    box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.1);
    outline: none;
  }

  .form-group input[type="file"] {
    padding: 8px;
    font-size: 14px;
  }

  .form-group button {
    width: 100%;
    background-color: #ff6600;
    color: white;
    border: none;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  .form-group button:hover {
    background-color: #e55500;
  }

  .form-group button:active {
    transform: scale(0.98);
  }

  .form-group button:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }

  .form-success {
    display: block;
    color: #059669;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 6px;
    padding: 12px;
    text-align: center;
    font-size: 15px;
    margin-top: 16px;
    font-weight: 500;
  }

  /* Mobile: stack form fields */
  @media (max-width: 600px) {
    .form-container {
      padding: 16px;
      margin: 24px 0 0 0;
      border-radius: 0;
      border-left: none;
      border-right: none;
    }

    .form-row {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .form-group input,
    .form-group textarea {
      font-size: 16px; /* Prevents iOS zoom on focus */
    }
  }
</style>