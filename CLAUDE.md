# CLAUDE.md - AngJobs Codebase Knowledge

## Project Overview

AngJobs is a job board website that aggregates and displays job postings from Hacker News's "Ask HN: Who is hiring?" threads. The site is built using VuePress v2 and is hosted at https://angjobs.com.

## Tech Stack

- **Framework**: VuePress 2.0.0-rc.13 (Static Site Generator)
- **Bundler**: Vite
- **Theme**: vuepress-theme-hope 2.0.0-rc.48
- **Frontend**: Vue 3.4.27
- **Node**: v20.0.0+

## Project Structure

```
AngJobs/
├── src/                        # Source files
│   ├── .vuepress/             # VuePress configuration (appears empty/minimal)
│   ├── jobs/                  # Job listings organized by month
│   │   ├── April-2025/        # Each month contains individual .md files
│   │   ├── May-2025/
│   │   ├── June-2025/
│   │   └── ...
│   ├── hackers/               # Additional content directory
│   └── README.md              # Homepage content
├── vuepress-plugin-angjobs/     # Custom VuePress plugin
│   ├── index.js               # Plugin entry point
│   ├── client.js              # Client-side configuration
│   ├── JobApplication.vue    # Job application form component
│   └── MyComponent.vue        # Additional component
├── _site/                     # Build output directory
├── package.json               # Project dependencies and scripts
└── README.md                  # Project documentation
```

## Key Components

### 1. Custom VuePress Plugin (`vuepress-plugin-angjobs`)

The project includes a custom VuePress plugin that registers Vue components globally:

- **JobApplication.vue**: A comprehensive job application form with:
  - Input fields for name, email, phone, resume (PDF)
  - Message/cover letter textarea
  - Form validation
  - Submission to external API endpoint
  - Professional styling with responsive design

- **MyComponent.vue**: Additional component (purpose unclear from analysis)

### 2. Job Listing Structure

Each job posting is a Markdown file with:
- Frontmatter containing:
  - `title`: Job title and company
  - `author.name`: HN username
  - `author.url`: Link to original HN post
- Job description in HTML format (likely scraped from HN)
- `<JobApplication />` component embedded at the end

Example structure:
```markdown
---
title: "Company : Job Title"
author:
  name: HNUsername
  url: https://news.ycombinator.com/item?id=12345678
---
[Job description content]
<JobApplication />
```

### 3. Job Application Flow

1. Users browse job listings
2. Each listing has an embedded application form
3. Form submissions are sent to: `https://victorantos-api.azurewebsites.net/jobapplicationsfromangjobs`
4. Submission includes:
   - User data (name, email, phone, message)
   - Resume file
   - Context (current URL, page title, author info)

## Build Process

- **Development**: `npm run docs:dev` (runs VuePress dev server)
- **Production**: `npm run build` or `npm run docs:build`
- **Clean dev**: `npm run docs:clean-dev` (clears cache)

## Important Patterns & Decisions

1. **Static Site Generation**: The site is statically generated, making it fast and SEO-friendly
2. **Monthly Organization**: Jobs are organized by month/year for easy navigation
3. **Embedded Forms**: Application forms are embedded directly in job listings
4. **External API**: Applications are processed by an external Azure-hosted API
5. **Minimal Configuration**: The project uses mostly default VuePress settings

## Key Files to Modify

- **Adding new jobs**: Create `.md` files in `src/jobs/[Month-Year]/`
- **Modifying application form**: Edit `vuepress-plugin-angjobs/JobApplication.vue`
- **Changing theme/layout**: Would need to add configuration in `src/.vuepress/`
- **Build configuration**: Modify `package.json` scripts

## Development Tips

1. Job files follow a specific naming pattern: `[HNUsername]-[CompanyInfo]-[JobTitle].md`
2. The JobApplication component expects specific frontmatter fields
3. The site appears to be designed for automated job scraping/importing
4. The `_site` directory contains a duplicate structure (possibly for testing)

## Potential Improvements

1. Add VuePress configuration files for customization
2. Implement job search/filtering functionality
3. Add job categories or tags
4. Create an admin interface for job management
5. Add application tracking for users
6. Implement RSS feed for new jobs

## Notes

- The project is relatively simple with minimal custom configuration
- Most functionality comes from VuePress defaults and the custom plugin
- The external API endpoint suggests this is part of a larger system
- Git branch "Improve-UI" suggests ongoing UI enhancements