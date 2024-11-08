// src/server/fileUtils.js
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate a content file from selected files
 * @param {Object} options
 * @param {string} options.watchDir - Base directory being watched
 * @param {string[]} options.files - Array of file paths to include
 * @param {string} options.name - Name of the content group
 * @param {string} options.description - Optional description of the content
 * @param {Object} options.config - Configuration object
 * @param {string} options.groupId - ID/slug of the group
 */
export async function generateContentFile({ watchDir, files, name, description, config, groupId }) {
  if (!groupId) {
    throw new Error('Group ID is required for file generation');
  }

  // Format timestamp for filename: YYYYMMDDHHMMSS
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')     // Remove dashes and colons
    .replace('T', '')         // Remove T separator
    .replace(/\.\d+Z$/, '');  // Remove milliseconds and Z

  // Setup directories with explicit group path
  const baseDir = path.join(watchDir, '.llmix');
  const groupDir = path.join(baseDir, groupId);

  try {
    // Ensure group directory exists
    await fs.mkdir(groupDir, { recursive: true });

    // Create filename: {groupId}-{timestamp}.txt
    const fileName = `${groupId}-${timestamp}.txt`;
    const outputPath = path.join(groupDir, fileName);

    // Create header with more metadata
    let outputContent = [
      '###',
      `# Content Group: ${name}`,
      description ? `# Description: ${description}` : '',
      `# Generated: ${new Date().toISOString()}`,
      `# Group ID: ${groupId}`,
      `# Files: ${files.length}`,
      `# Directory: ${groupDir}`,
      '###\n\n'
    ].join('\n');

    // Add each file's content with error handling
    for (const file of files) {
      try {
        const filePath = path.join(watchDir, file);
        const stats = await fs.stat(filePath);

        if (!stats.isFile()) {
          console.warn(`Skipping non-file: ${file}`);
          continue;
        }

        const content = await fs.readFile(filePath, 'utf8');
        outputContent += [
          `### File: ${file} ###\n`,
          `# Size: ${stats.size} bytes`,
          `# Modified: ${stats.mtime.toISOString()}`,
          content,
          '\n----------------------------------------\n\n'
        ].join('\n');
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
        outputContent += [
          `### File: ${file} ###\n`,
          `# Error: Failed to read file - ${error.message}`,
          '\n----------------------------------------\n\n'
        ].join('\n');
      }
    }

    // Write the output file
    await fs.writeFile(outputPath, outputContent, 'utf8');

    // Return complete details about the generated file
    return {
      success: true,
      path: path.join(groupId, fileName), // Include group in path
      fullPath: outputPath,
      fileCount: files.length,
      groupId,
      timestamp: new Date().toISOString(),
      fileName,
      directory: groupDir,
      size: outputContent.length
    };
  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error(
      `Failed to generate content file: ${error.message}`
    );
  }
}

/**
 * Check if a file exists in a specific path
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up empty group directories
 * @param {string} baseDir - Base .llmix directory
 */
export async function cleanupEmptyDirectories(baseDir) {
  try {
    const llmixDir = path.join(baseDir, '.llmix');

    // Ensure .llmix directory exists
    if (!(await fileExists(llmixDir))) {
      return;
    }

    const entries = await fs.readdir(llmixDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'default') {
        const dirPath = path.join(llmixDir, entry.name);
        const files = await fs.readdir(dirPath);
        if (files.length === 0) {
          await fs.rmdir(dirPath);
          console.log(`Removed empty directory: ${entry.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up directories:', error);
  }
}

/**
 * Move files from one group directory to another
 * @param {string} baseDir - Base .llmix directory
 * @param {string} oldGroupId - Original group ID
 * @param {string} newGroupId - New group ID
 */
export async function moveGroupFiles(baseDir, oldGroupId, newGroupId) {
  const llmixDir = path.join(baseDir, '.llmix');
  const oldPath = path.join(llmixDir, oldGroupId);
  const newPath = path.join(llmixDir, newGroupId);

  try {
    // Create new directory
    await fs.mkdir(newPath, { recursive: true });

    // Check if old directory exists
    if (await fileExists(oldPath)) {
      // Get all files in old directory
      const files = await fs.readdir(oldPath);

      // Move each file
      for (const file of files) {
        const oldFilePath = path.join(oldPath, file);
        // Replace old group ID with new one in filename
        const newFileName = file.replace(oldGroupId, newGroupId);
        const newFilePath = path.join(newPath, newFileName);
        await fs.rename(oldFilePath, newFilePath);
      }

      // Remove old directory
      await fs.rm(oldPath, { recursive: true, force: true });
      console.log(`Moved files from ${oldGroupId} to ${newGroupId}`);
    }
  } catch (error) {
    console.error('Error moving group files:', error);
    throw error;
  }
}

/**
 * Delete a group's directory and all its contents
 * @param {string} baseDir - Base .llmix directory
 * @param {string} groupId - Group ID to delete
 */
export async function deleteGroupDirectory(baseDir, groupId) {
  const groupDir = path.join(baseDir, '.llmix', groupId);
  try {
    if (await fileExists(groupDir)) {
      await fs.rm(groupDir, { recursive: true, force: true });
      console.log(`Deleted directory for group: ${groupId}`);
    }
  } catch (error) {
    console.error(`Error deleting directory for group ${groupId}:`, error);
    throw error;
  }
}
