<template>
  <div class="promo-section">
    <a href="https://muz11.com" target="_blank" class="promo-card promo-muz11">
      <img src="/muz11-icon.png" alt="Muz11" class="promo-icon" />
      <div class="promo-text">
        <strong>Need focus music?</strong>
        <span>Muz11 - 100+ curated playlists for coding</span>
      </div>
      <svg class="promo-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </a>
    <a href="https://sneos.com" target="_blank" class="promo-card promo-sneos">
      <img src="/sneos-icon.png" alt="Sneos" class="promo-icon" />
      <div class="promo-text">
        <strong>Compare AI models?</strong>
        <span>Sneos - Chat with multiple AIs side by side</span>
      </div>
      <svg class="promo-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </a>
    <a href="https://career.coffee" target="_blank" class="promo-card promo-coffee">
      <img src="/careercoffee-icon.svg" alt="Career.Coffee" class="promo-icon" />
      <div class="promo-text">
        <strong>Love coffee?</strong>
        <span>Want to switch careers? Check Career.Coffee!</span>
      </div>
      <svg class="promo-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </a>
  </div>

  <div class="form-container">
    <div class="form-header">
      <h2 class="form-title">Apply for this Role</h2>
      <p class="form-subtitle">Your application will be forwarded to the hiring contact.</p>
    </div>

    <form @submit.prevent="submitForm" class="application-form">
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
          <label for="phone">
            Phone
            <span class="optional">Optional</span>
          </label>
          <input
            type="tel"
            id="phone"
            v-model="form.phone"
            placeholder="+1 555 123 4567"
          />
        </div>

        <div class="form-group">
          <label for="resume">Resume (PDF)</label>
          <div class="file-input-wrapper">
            <input
              type="file"
              id="resume"
              @change="handleFileUpload"
              accept=".pdf"
              required
              class="file-input"
            />
            <div class="file-input-display">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <span class="file-text">{{ form.resume ? form.resume.name : 'Choose PDF file' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="message">
          Cover Note
          <span class="optional">Optional</span>
        </label>
        <textarea
          id="message"
          v-model="form.message"
          rows="4"
          placeholder="Brief introduction about yourself..."
        ></textarea>
      </div>

      <div class="form-group">
        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          <svg v-if="isSubmitting" class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" opacity="0.3"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
          </svg>
          <span>{{ isSubmitting ? 'Sending...' : 'Send Application' }}</span>
          <svg v-if="!isSubmitting" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

      <transition name="fade">
        <div v-if="formSubmitted" class="form-success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>Application sent! The hiring contact will receive your details.</span>
        </div>
      </transition>
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

      const formData = new FormData();
      formData.append("name", this.form.fullName);
      formData.append("email", this.form.email);
      formData.append("resume", this.form.resume);
      formData.append("text", this.form.message);
      formData.append("url", document.URL);
      formData.append("title", document.title);
      formData.append("source", this.$page.frontmatter.author.url);
      formData.append("author", this.$page.frontmatter.author.name);

      fetch('https://victorantos-api.azurewebsites.net/jobapplicationsfromangjobs', {
          method: 'POST',
          body: formData,
      })
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.json();
      })
      .then(data => {
          this.formSubmitted = true;
          this.isSubmitting = false;
          this.resetForm();
          console.log('Form successfully submitted:', data);
      })
      .catch(error => {
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
/* Promo Section */
.promo-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 600px;
  margin: 40px auto 0;
}

.promo-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: var(--apple-radius-lg, 20px);
  text-decoration: none;
  transition: all 0.25s ease-out;
  background: var(--apple-bg-primary, #FFFFFF);
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
}

.promo-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--apple-shadow-md, 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04));
}

.promo-card:hover .promo-arrow {
  transform: translateX(4px);
}

.promo-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--apple-radius-md, 14px);
  flex-shrink: 0;
}

.promo-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.promo-text strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--apple-text-primary, #1D1D1F);
  letter-spacing: -0.01em;
}

.promo-muz11 strong { color: #667eea; }
.promo-sneos strong { color: #3b82f6; }
.promo-coffee strong { color: #78350f; }

.promo-text span {
  font-size: 12px;
  color: var(--apple-text-secondary, #6E6E73);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.promo-arrow {
  color: var(--apple-text-tertiary, #86868B);
  flex-shrink: 0;
  transition: transform 0.2s ease-out;
}

/* Form Container */
.form-container {
  max-width: 600px;
  margin: 24px auto 0;
  background: var(--apple-bg-secondary, #F5F5F7);
  padding: 32px;
  border-radius: var(--apple-radius-xl, 24px);
}

.form-header {
  margin-bottom: 28px;
}

.form-title {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--apple-text-primary, #1D1D1F);
  letter-spacing: -0.02em;
}

.form-subtitle {
  margin: 0;
  font-size: 15px;
  color: var(--apple-text-secondary, #6E6E73);
}

/* Form Layout */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-weight: 500;
  font-size: 14px;
  color: var(--apple-text-primary, #1D1D1F);
}

.form-group .optional {
  font-weight: 400;
  font-size: 12px;
  color: var(--apple-text-tertiary, #86868B);
  background: var(--apple-bg-primary, #FFFFFF);
  padding: 2px 8px;
  border-radius: var(--apple-radius-pill, 9999px);
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group textarea {
  width: 100%;
  padding: 14px 18px;
  border: none;
  border-radius: var(--apple-radius-md, 14px);
  font-size: 16px;
  font-family: inherit;
  background: var(--apple-bg-primary, #FFFFFF);
  color: var(--apple-text-primary, #1D1D1F);
  box-sizing: border-box;
  transition: all 0.25s ease-out;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--apple-text-tertiary, #86868B);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.15);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

/* File Input */
.file-input-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.file-input-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--apple-bg-primary, #FFFFFF);
  border-radius: var(--apple-radius-md, 14px);
  border: 2px dashed var(--apple-border-light, rgba(0, 0, 0, 0.08));
  transition: all 0.25s ease-out;
  color: var(--apple-text-secondary, #6E6E73);
}

.file-input-wrapper:hover .file-input-display {
  border-color: var(--apple-primary, #F97316);
  color: var(--apple-primary, #F97316);
}

.file-text {
  font-size: 15px;
}

/* Submit Button */
.submit-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: var(--apple-primary, #F97316);
  color: white;
  border: none;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--apple-radius-pill, 9999px);
  cursor: pointer;
  transition: all 0.25s ease-out;
  box-shadow: var(--apple-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04));
}

.submit-btn:hover:not(:disabled) {
  background: var(--apple-primary-hover, #EA580C);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.submit-btn .spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Success Message */
.form-success {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #248A3D;
  background: rgba(52, 199, 89, 0.12);
  border-radius: var(--apple-radius-md, 14px);
  padding: 16px 20px;
  margin-top: 20px;
  font-size: 15px;
  font-weight: 500;
}

.form-success svg {
  flex-shrink: 0;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .promo-section {
    grid-template-columns: 1fr;
    margin: 32px 0 0 0;
    padding: 0 4px;
  }

  .promo-card {
    padding: 14px 16px;
    border-radius: var(--apple-radius-md, 14px);
  }

  .promo-text span {
    white-space: normal;
  }

  .form-container {
    padding: 24px 20px;
    margin: 20px 0 0 0;
    border-radius: var(--apple-radius-lg, 20px);
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .form-group input,
  .form-group textarea {
    font-size: 16px; /* Prevents iOS zoom */
  }

  .form-title {
    font-size: 20px;
  }

  .submit-btn {
    padding: 14px 20px;
    font-size: 15px;
  }
}

/* Dark Mode */
html.dark .promo-card {
  background: var(--apple-bg-secondary, #2C2C2E);
}

html.dark .form-container {
  background: var(--apple-bg-tertiary, #3A3A3C);
}

html.dark .form-group input,
html.dark .form-group textarea,
html.dark .file-input-display {
  background: var(--apple-bg-secondary, #2C2C2E);
}
</style>
