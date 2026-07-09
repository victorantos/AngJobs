---
title: AngJobs
hideHeader: true
description: Tech jobs from Hacker News 'Who is hiring?' threads — verified opportunities posted by founders and hiring managers, no middlemen.
---

<style>
.home-promo-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 40px;
}

.home-promo-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: #FFFFFF;
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.25s ease-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04);
}

.home-promo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
}

.home-promo-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  flex-shrink: 0;
}

.home-promo-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.home-promo-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.home-promo-desc {
  font-size: 13px;
  color: #6E6E73;
}

.home-promo-arrow {
  color: #86868B;
  transition: transform 0.2s ease-out;
}

.home-promo-card:hover .home-promo-arrow {
  transform: translateX(4px);
}

.promo-muz11 .home-promo-title { color: #667eea; }
.promo-codorex .home-promo-title { color: #4CAF50; }
.promo-sneos .home-promo-title { color: #3b82f6; }
.promo-coffee .home-promo-title { color: #78350f; }
.promo-nestclaw .home-promo-title { color: #d97706; }
.promo-careercomputer .home-promo-title { color: #0284c7; }

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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.home-jobs-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 20px 24px;
  text-decoration: none;
  transition: all 0.25s ease-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 6px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home-jobs-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
}

.home-jobs-month {
  font-size: 17px;
  font-weight: 600;
  color: #1D1D1F;
  letter-spacing: -0.01em;
}

.home-jobs-count {
  font-size: 28px;
  font-weight: 700;
  color: #F97316;
  letter-spacing: -0.02em;
}

.home-jobs-label {
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
  .home-promo-card,
  .home-jobs-card {
    background: #2C2C2E;
  }

  .home-promo-desc,
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
  .home-promo-section {
    grid-template-columns: 1fr;
  }

  .home-promo-card {
    padding: 16px 20px;
    border-radius: 16px;
  }

  .home-promo-icon {
    width: 44px;
    height: 44px;
  }

  .home-jobs-title {
    font-size: 24px;
  }
}

.home-hero { text-align: center; margin: 24px 0 8px; }
.home-hero p { max-width: 42rem; margin: 12px auto; }
.home-hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.home-hero-button {
  display: inline-block; padding: 10px 22px; border-radius: 8px;
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
      <span class="home-jobs-count">203+</span>
      <span class="home-jobs-label">jobs available</span>
    </a>
    <a href="/jobs/tag/june-2026/" class="home-jobs-card">
      <span class="home-jobs-month">June 2026</span>
      <span class="home-jobs-count">231+</span>
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

<div class="home-promo-section">
  <a href="https://muz11.com" target="_blank" class="home-promo-card promo-muz11">
    <img src="/media/public/muz11-icon.png" alt="Muz11" class="home-promo-icon" />
    <div class="home-promo-text">
      <span class="home-promo-title">Need focus music?</span>
      <span class="home-promo-desc">Muz11 - 100+ curated playlists for coding</span>
    </div>
    <svg class="home-promo-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  </a>
  <a href="https://codorex.com" target="_blank" class="home-promo-card promo-codorex">
    <img src="/media/public/codorex-icon.png" alt="Codorex" class="home-promo-icon" />
    <div class="home-promo-text">
      <span class="home-promo-title">Kids want to code?</span>
      <span class="home-promo-desc">Codorex - AI game creation for ages 7-14</span>
    </div>
    <svg class="home-promo-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  </a>
  <a href="https://sneos.com" target="_blank" class="home-promo-card promo-sneos">
    <img src="/media/public/sneos-icon.png" alt="Sneos" class="home-promo-icon" />
    <div class="home-promo-text">
      <span class="home-promo-title">Compare AI models?</span>
      <span class="home-promo-desc">Sneos - Chat with multiple AIs side by side</span>
    </div>
    <svg class="home-promo-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  </a>
  <a href="https://career.coffee" target="_blank" class="home-promo-card promo-coffee">
    <img src="/media/public/careercoffee-icon.svg" alt="Career.Coffee" class="home-promo-icon" />
    <div class="home-promo-text">
      <span class="home-promo-title">Love coffee?</span>
      <span class="home-promo-desc">Want to switch careers? Check Career.Coffee!</span>
    </div>
    <svg class="home-promo-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  </a>
  <a href="https://nestclaw.com" target="_blank" class="home-promo-card promo-nestclaw">
    <img src="/media/public/nestclaw-icon.svg" alt="NestClaw" class="home-promo-icon" />
    <div class="home-promo-text">
      <span class="home-promo-title">Need an AI agent?</span>
      <span class="home-promo-desc">NestClaw - Your own private AI agent on a dedicated server</span>
    </div>
    <svg class="home-promo-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  </a>
  <a href="https://career.computer" target="_blank" class="home-promo-card promo-careercomputer">
    <img src="/media/public/careercomputer-icon.svg" alt="Career.Computer" class="home-promo-icon" />
    <div class="home-promo-text">
      <span class="home-promo-title">Find tech jobs?</span>
      <span class="home-promo-desc">Career.Computer - Tech jobs for tomorrow's innovators</span>
    </div>
    <svg class="home-promo-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  </a>
</div>
