// src/server/fileUtils.js
import fs from 'fs/promises';
import path from 'path';

export async function generateContentFile({ watchDir, files, name, description, config }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(watchDir, config.output?.directory || '.llmix');

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Generate output filename
  const fileName = (config.output?.fileNamePattern || '{name}-{timestamp}.txt')
    .replace('{name}', name.toLowerCase().replace(/\s+/g, '-'))
    .replace('{timestamp}', timestamp);

  const outputPath = path.join(outputDir, fileName);

  // Create header
  let outputContent = [
    '###',
    `# Content Group: ${name}`,
    description ? `# Description: ${description}` : '',
    `# Generated: ${new Date().toISOString()}`,
    `# Files: ${files.length}`,
    '###\n\n'
  ].join('\n');

  // Add each file's content
  for (const file of files) {
    const filePath = path.join(watchDir, file);
    const content = await fs.readFile(filePath, 'utf8');
    outputContent += [
      '###',
      `# File: ${file}`,
      '###\n',
      content,
      '\n----------------------------------------\n\n'
    ].join('\n');
  }

  await fs.writeFile(outputPath, outputContent);

  return {
    success: true,
    path: outputPath,
    fileCount: files.length
  };
}
