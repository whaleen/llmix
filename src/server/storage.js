// src/server/storage.js
import fs from 'fs/promises';
import path from 'path';

export class Storage {
  constructor(watchDir) {
    this.baseDir = path.join(watchDir, '.llmix');
    this.groupsFile = path.join(this.baseDir, 'groups.json');
  }

  async init() {
    try {
      // Create base .llmix directory
      await fs.mkdir(this.baseDir, { recursive: true });

      try {
        await fs.access(this.groupsFile);
      } catch {
        // Create default group with directory
        const defaultGroup = {
          id: 'content-group-1',
          name: 'Content Group 1',
          files: [],
          description: '',
          color: 'blue',
          history: []
        };
        await this.createGroupDirectory(defaultGroup.id);
        await this.saveGroups([defaultGroup]);
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
      throw error;
    }
  }

  async createGroupDirectory(groupId) {
    if (!groupId) return;
    const groupDir = path.join(this.baseDir, groupId);
    try {
      await fs.mkdir(groupDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory for group ${groupId}:`, error);
      throw error;
    }
    return groupDir;
  }

  async cleanupEmptyDirectories() {
    try {
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(this.baseDir, entry.name);
          const files = await fs.readdir(dirPath);
          if (files.length === 0) {
            await fs.rmdir(dirPath);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up directories:', error);
    }
  }

  async deleteGroupDirectory(groupId) {
    if (!groupId) return;
    try {
      const groupDir = path.join(this.baseDir, groupId);
      await fs.rm(groupDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Error deleting directory for group ${groupId}:`, error);
    }
  }

  async renameGroupDirectory(oldId, newId) {
    if (!oldId || !newId) return;
    try {
      const oldPath = path.join(this.baseDir, oldId);
      const newPath = path.join(this.baseDir, newId);

      // Create new directory
      await fs.mkdir(newPath, { recursive: true });

      try {
        // Move files from old directory to new directory
        const files = await fs.readdir(oldPath);
        for (const file of files) {
          const oldFilePath = path.join(oldPath, file);
          const newFilePath = path.join(newPath, file);
          await fs.rename(oldFilePath, newFilePath);
        }
        // Remove old directory
        await fs.rm(oldPath, { recursive: true, force: true });
      } catch (error) {
        // Old directory might not exist
        console.log(`No existing directory for ${oldId}`);
      }
    } catch (error) {
      console.error(`Error renaming directory from ${oldId} to ${newId}:`, error);
    }
  }

  async getGroups() {
    try {
      const data = await fs.readFile(this.groupsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading groups:', error);
      return [];
    }
  }

  async saveGroups(groups) {
    try {
      await fs.writeFile(this.groupsFile, JSON.stringify(groups, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving groups:', error);
      throw error;
    }
  }

  getGroupDirectory(groupId) {
    return path.join(this.baseDir, groupId);
  }

  async addGenerationToHistory(groupId, fileName) {
    try {
      console.log('Adding to history:', { groupId, fileName });
      const groups = await this.getGroups();
      const group = groups.find(g => g.id === groupId);

      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }

      group.history = group.history || [];
      group.history.unshift({
        fileName,
        timestamp: new Date().toISOString()
      });

      await this.saveGroups(groups);
      console.log('History updated for group:', groupId);
    } catch (error) {
      console.error('Error updating group history:', error);
      throw error;
    }
  }
}
