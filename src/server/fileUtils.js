// src/server/fileUtils.js
import fs from 'fs/promises';
import path from 'path';

export async function generateContentFile({ watchDir, files, name, description, config }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(watchDir, config.output?.directory || '.llmix');

  try {
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
      try {
        const filePath = path.join(watchDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        outputContent += [
          `### File: ${file} ###\n`,
          content,
          '\n----------------------------------------\n\n'
        ].join('');
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
        throw new Error(`Failed to read file: ${file}`);
      }
    }

    // Write the output file
    await fs.writeFile(outputPath, outputContent, 'utf8');

    return {
      success: true,
      path: path.relative(watchDir, outputPath),
      fileCount: files.length
    };
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error(error.message || 'Failed to generate content file');
  }
}
