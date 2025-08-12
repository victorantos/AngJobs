import fs from 'fs';
import path from 'path';

const jobsDir = path.resolve('src/jobs');

// Get all month directories
const months = fs.readdirSync(jobsDir)
  .filter(item => {
    const fullPath = path.join(jobsDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           item.match(/^[A-Za-z]+-20\d{2}$/) && // Match format like "August-2025"
           item !== 'README'; // Exclude non-month directories
  });

console.log('Adding JobNavigation to job files in months:', months);

let totalUpdated = 0;

months.forEach(month => {
  const monthDir = path.join(jobsDir, month);
  const files = fs.readdirSync(monthDir).filter(file => 
    file.endsWith('.md') && 
    !file.includes('README.md') &&
    !file.includes('all-jobs.md')
  );

  console.log(`Processing ${files.length} job files in ${month}...`);

  files.forEach(file => {
    const filePath = path.join(monthDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if JobNavigation is already present
    if (content.includes('<JobNavigation />')) {
      return; // Skip if already added
    }

    // Find the end of frontmatter and add JobNavigation
    const frontmatterEnd = content.indexOf('---', 3); // Find second ---
    if (frontmatterEnd !== -1) {
      const beforeContent = content.substring(0, frontmatterEnd + 3);
      const afterContent = content.substring(frontmatterEnd + 3);
      
      const newContent = beforeContent + '\n\n<JobNavigation />\n' + afterContent;
      
      fs.writeFileSync(filePath, newContent);
      totalUpdated++;
    } else {
      console.warn(`Could not find frontmatter in ${file}`);
    }
  });
});

console.log(`Successfully added JobNavigation component to ${totalUpdated} job files!`);