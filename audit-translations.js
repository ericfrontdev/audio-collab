#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Patterns that indicate hardcoded user-facing text
const textPatterns = [
  />\s*[A-Z][a-z]+(?:\s+[A-Za-z]+)*\s*</g, // Text between JSX tags starting with capital letter
  /placeholder=["']([^"']+)["']/g, // Placeholder attributes
  /title=["']([^"']+)["']/g, // Title attributes
  /label=["']([^"']+)["']/g, // Label attributes
  /toast\.(error|success|info|warning)\(["']([^"']+)["']/g, // Toast messages
  /alert\(["']([^"']+)["']/g, // Alert messages
];

// Files/directories to ignore
const ignorePatterns = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
];

// Common non-translatable strings to ignore
const ignoreStrings = [
  'id', 'key', 'className', 'onClick', 'onChange', 'onSubmit',
  'div', 'span', 'button', 'input', 'form', 'label',
  'true', 'false', 'null', 'undefined',
  'w-', 'h-', 'p-', 'm-', 'bg-', 'text-', 'flex', 'grid', // Tailwind classes
];

function shouldIgnorePath(filePath) {
  return ignorePatterns.some(pattern => filePath.includes(pattern));
}

function hasUseTranslations(content) {
  return content.includes('useTranslations') || content.includes('import { useTranslations }');
}

function hasServerTranslations(content) {
  return content.includes('getTranslations') || content.includes('import { getTranslations }');
}

function findHardcodedText(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Skip if file already uses translations
  if (hasUseTranslations(content) || hasServerTranslations(content)) {
    return null;
  }

  // Skip if it's not a component/page (no JSX)
  if (!content.includes('return (') && !content.includes('return(')) {
    return null;
  }

  // Look for common hardcoded text patterns
  const issues = [];

  // Check for placeholder text
  const placeholderMatches = content.match(/placeholder=["']([^"']{10,})["']/g);
  if (placeholderMatches) {
    placeholderMatches.forEach(match => {
      const text = match.match(/["']([^"']+)["']/)[1];
      if (!ignoreStrings.some(s => text.includes(s))) {
        issues.push({ type: 'placeholder', text });
      }
    });
  }

  // Check for toast messages
  const toastMatches = content.match(/toast\.(error|success|info|warning)\(["']([^"']+)["']/g);
  if (toastMatches) {
    toastMatches.forEach(match => {
      const text = match.match(/["']([^"']+)["']/)[1];
      issues.push({ type: 'toast', text });
    });
  }

  // Check for button text
  const buttonMatches = content.match(/<[Bb]utton[^>]*>([A-Z][a-z]+(?:\s+[A-Za-z]+)*)<\/[Bb]utton>/g);
  if (buttonMatches) {
    buttonMatches.forEach(match => {
      const text = match.replace(/<\/?[Bb]utton[^>]*>/g, '').trim();
      if (text.length > 2 && !text.match(/^[{<]/)) {
        issues.push({ type: 'button', text });
      }
    });
  }

  // Check for simple text in JSX
  const simpleTextMatches = content.match(/>([A-Z][a-z]{3,}(?:\s+[A-Za-z]+)*)</g);
  if (simpleTextMatches) {
    simpleTextMatches.slice(0, 5).forEach(match => { // Limit to first 5 to avoid noise
      const text = match.replace(/[><]/g, '').trim();
      if (text.length > 4 && !text.match(/^[{<]/) && !ignoreStrings.some(s => text.includes(s))) {
        issues.push({ type: 'text', text });
      }
    });
  }

  return issues.length > 0 ? issues : null;
}

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);

    if (shouldIgnorePath(filePath)) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      scanDirectory(filePath, results);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const issues = findHardcodedText(filePath);
      if (issues) {
        results.push({
          file: filePath.replace('/Users/ericsplugins/Desktop/Projects/audio-collab/', ''),
          issues
        });
      }
    }
  });

  return results;
}

// Run the audit
console.log('🔍 Scanning for hardcoded text...\n');

const componentsResults = scanDirectory('/Users/ericsplugins/Desktop/Projects/audio-collab/components');
const appResults = scanDirectory('/Users/ericsplugins/Desktop/Projects/audio-collab/app/[locale]');

const allResults = [...componentsResults, ...appResults];

if (allResults.length === 0) {
  console.log('✅ No hardcoded text found! All components use translations.');
} else {
  console.log(`❌ Found ${allResults.length} files with hardcoded text:\n`);

  // Group by directory
  const byDirectory = {};
  allResults.forEach(result => {
    const dir = result.file.split('/').slice(0, -1).join('/');
    if (!byDirectory[dir]) {
      byDirectory[dir] = [];
    }
    byDirectory[dir].push(result);
  });

  // Print results grouped by directory
  Object.keys(byDirectory).sort().forEach(dir => {
    console.log(`\n📁 ${dir}/`);
    byDirectory[dir].forEach(result => {
      const fileName = result.file.split('/').pop();
      console.log(`  └─ ${fileName}`);

      // Group issues by type
      const byType = {};
      result.issues.forEach(issue => {
        if (!byType[issue.type]) {
          byType[issue.type] = [];
        }
        byType[issue.type].push(issue.text);
      });

      Object.keys(byType).forEach(type => {
        const unique = [...new Set(byType[type])];
        console.log(`     ${type}: ${unique.slice(0, 3).join(', ')}${unique.length > 3 ? '...' : ''}`);
      });
    });
  });

  console.log(`\n\n📊 Summary: ${allResults.length} files need translation`);
}
