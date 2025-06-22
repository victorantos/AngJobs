#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate simple index page for a month
function generateSimpleMonthIndex(monthDir) {
  const jobsDir = path.join(monthDir);
  const files = fs.readdirSync(jobsDir).filter(f => f.endsWith('.md') && f !== 'README.md');
  
  const monthName = path.basename(monthDir);
  
  let indexContent = `# ${monthName.replace('-', ' ')} Jobs\n\n`;
  
  // Process each job file
  files.forEach(filename => {
    const filePath = path.join(jobsDir, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);
    
    if (frontmatter.title) {
      // Clean up the title to remove any HTML or problematic characters
      const cleanTitle = frontmatter.title
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&[^;]+;/g, '') // Remove HTML entities
        .replace(/[<>]/g, '') // Remove any remaining angle brackets
        .replace(/[$]/g, '') // Remove dollar signs that break parsing
        .trim();
      
      // Clean up the filename for the link
      const cleanFilename = filename.replace('.md', '').replace(/[<>$]/g, '');
      const link = `/jobs/${monthName}/${cleanFilename}`;
      
      // Escape any remaining special characters in the title
      const safeTitle = cleanTitle.replace(/[[\]]/g, '');
      
      indexContent += `- [${safeTitle}](${link})\n`;
    }
  });
  
  fs.writeFileSync(path.join(monthDir, 'README.md'), indexContent);
  console.log(`Generated simple index for ${monthName}: ${files.length} jobs`);
}

// Main execution
const jobsRoot = path.join(__dirname, '..', 'src', 'jobs');
const months = fs.readdirSync(jobsRoot).filter(f => {
  const stat = fs.statSync(path.join(jobsRoot, f));
  return stat.isDirectory();
});

months.forEach(month => {
  const monthDir = path.join(jobsRoot, month);
  generateSimpleMonthIndex(monthDir);
});

console.log('Simple job index generation complete!');