#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to extract job info from filename and content
function parseJobFile(filePath, filename) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: markdown } = matter(content);
  
  // Parse filename for job info
  const parts = filename.replace('.md', '').split('-');
  const author = parts[0];
  
  // Extract company and position from title
  const titleParts = (frontmatter.title || '').split(' : ');
  const company = titleParts[0] || 'Unknown Company';
  const position = titleParts[1] || frontmatter.title || 'Unknown Position';
  
  // Extract location and type from content
  let location = 'Remote';
  let type = 'Full-time';
  let salary = null;
  
  const locationMatch = markdown.match(/(?:Remote|Onsite|Hybrid|REMOTE|ONSITE|HYBRID)(?:\s*\([^)]+\))?/i);
  if (locationMatch) location = locationMatch[0];
  
  const typeMatch = markdown.match(/(?:Full-time|Part-time|Contract|Freelance|Internship)/i);
  if (typeMatch) type = typeMatch[0];
  
  const salaryMatch = markdown.match(/\$[\d,]+k?(?:\s*-\s*\$[\d,]+k?)?|\$[\d,]+(?:\s*-\s*\$[\d,]+)?|[\d,]+k\s*(?:USD|EUR|GBP)/i);
  if (salaryMatch) salary = salaryMatch[0];
  
  // Extract tech stack for tags
  const tags = [];
  const techKeywords = [
    'React', 'Vue', 'Angular', 'Node', 'Python', 'Java', 'Go', 'Rust', 
    'TypeScript', 'JavaScript', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
    'Machine Learning', 'AI', 'DevOps', 'Backend', 'Frontend', 'Fullstack',
    'Mobile', 'iOS', 'Android', 'Data', 'Security', 'Cloud', 'SaaS'
  ];
  
  techKeywords.forEach(tech => {
    const regex = new RegExp(`\\b${tech}\\b`, 'gi');
    if (markdown.match(regex)) {
      tags.push(tech);
    }
  });
  
  // Limit tags to 5 most relevant
  tags.splice(5);
  
  return {
    filename,
    path: `/jobs/${path.basename(path.dirname(filePath))}/${filename.replace('.md', '')}`,
    position,
    company,
    location,
    type,
    tags,
    author: frontmatter.author?.name || author,
    hnUrl: frontmatter.author?.url || '#',
    timeAgo: 'recently',
    salary
  };
}

// Function to generate index page for a month
function generateMonthIndex(monthDir) {
  const jobsDir = path.join(monthDir);
  const files = fs.readdirSync(jobsDir).filter(f => f.endsWith('.md') && f !== 'README.md');
  
  const jobs = files.map(filename => {
    const filePath = path.join(jobsDir, filename);
    return parseJobFile(filePath, filename);
  });
  
  const monthName = path.basename(monthDir);
  
  const indexContent = `---
layout: false
---

<script setup>
const jobs = ref(${JSON.stringify(jobs, null, 2)})
</script>

<template>
  <MonthlyJobsPage month="${monthName}" :jobs="jobs" />
</template>

<style>
/* Reset any theme defaults for this page */
.theme-default-content {
  max-width: none !important;
  padding: 0 !important;
}

.theme-container {
  background: #f8f9fa;
}

.navbar,
.sidebar {
  display: none !important;
}
</style>`;

  fs.writeFileSync(path.join(monthDir, 'README.md'), indexContent);
  console.log(`Generated index for ${monthName}: ${jobs.length} jobs`);
}

// Main execution
const jobsRoot = path.join(__dirname, '..', 'src', 'jobs');
const months = fs.readdirSync(jobsRoot).filter(f => {
  const stat = fs.statSync(path.join(jobsRoot, f));
  return stat.isDirectory();
});

months.forEach(month => {
  const monthDir = path.join(jobsRoot, month);
  generateMonthIndex(monthDir);
});

console.log('Job index generation complete!');