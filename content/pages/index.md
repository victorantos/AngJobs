---
title: AngJobs
promos: true
hideHeader: true
description: Tech jobs from Hacker News 'Who is hiring?' threads — verified opportunities posted by founders and hiring managers, no middlemen.
---

<style>

.home-jobs-section {
  margin-top: 48px;
}

.home-jobs-title {
  font-size: 28px;
  font-weight: 700;
  color: #1D1D1F;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
}

.home-jobs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.home-jobs-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.home-jobs-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
}

.home-jobs-month { font-size: 0.8rem; 
  font-size: 17px;
  font-weight: 600;
  color: #1D1D1F;
  letter-spacing: -0.01em;
}

.home-jobs-count { font-size: 1.4rem; 
  font-size: 28px;
  font-weight: 700;
  color: #F97316;
  letter-spacing: -0.02em;
}

.home-jobs-label { font-size: 0.7rem; 
  font-size: 13px;
  color: #6E6E73;
}

.home-companies {
  font-size: 15px;
  color: #6E6E73;
  line-height: 1.6;
  margin-top: 16px;
}

.home-companies strong {
  color: #1D1D1F;
}

html[data-theme="dark"] {
  .home-jobs-card {
    background: #2C2C2E;
  }

  .home-jobs-label,
  .home-companies {
    color: #A1A1A6;
  }

  .home-jobs-title,
  .home-jobs-month,
  .home-companies strong {
    color: #F5F5F7;
  }
}

@media (max-width: 768px) {

  .home-jobs-title {
    font-size: 24px;
  }
}

.home-hero { text-align: center; margin: 12px 0 4px; }
.home-hero h1 { font-size: clamp(1.6rem, 5.5vw, 2.4rem); margin: 0 0 8px; }
.home-hero p { max-width: 40rem; margin: 8px auto; font-size: 0.95rem; }
.home-hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.home-hero-button {
  display: inline-block; padding: 8px 18px; border-radius: 8px;
  background: #FF6600; color: #fff; font-weight: 600; text-decoration: none;
}
.home-hero-button--secondary { background: transparent; color: inherit; border: 1px solid currentColor; }
</style>

<header class="home-hero">
  <h1>Tech Jobs from Hacker News</h1>
  <p>Verified opportunities from the monthly "Who is hiring?" threads — posted by founders and hiring managers directly. No middlemen.</p>
  <p class="home-hero-actions">
    <a class="home-hero-button" href="/jobs/tag/july-2026/">July 2026 jobs</a>
    <a class="home-hero-button home-hero-button--secondary" href="/jobs/">Browse all jobs</a>
  </p>
</header>

<div class="home-jobs-section">
  <h2 class="home-jobs-title">Latest Jobs</h2>
  <div class="home-jobs-grid">
    <a href="/jobs/tag/july-2026/" class="home-jobs-card">
      <span class="home-jobs-month">July 2026</span>
      <span class="home-jobs-count">260+</span>
      <span class="home-jobs-label">jobs available</span>
    </a>
    <a href="/jobs/tag/june-2026/" class="home-jobs-card">
      <span class="home-jobs-month">June 2026</span>
      <span class="home-jobs-count">251+</span>
      <span class="home-jobs-label">jobs available</span>
    </a>
    <a href="/jobs/tag/may-2026/" class="home-jobs-card">
      <span class="home-jobs-month">May 2026</span>
      <span class="home-jobs-count">285+</span>
      <span class="home-jobs-label">jobs available</span>
    </a>
  </div>
  <p class="home-companies"><strong>Companies hiring:</strong> Apple, DuckDuckGo, Temporal, Sesame, Sphinx Defense, MixRank, and more.</p>
</div>

