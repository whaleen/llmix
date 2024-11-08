// src/server/api/groups.js
export function setupGroupsAPI(app, { storage }) {
  // Update single group
  app.put('/api/groups/:id', async (req, res) => {
    try {
      const oldId = req.params.id;
      const updatedGroup = req.body;
      const groups = await storage.getGroups();
      const index = groups.findIndex(g => g.id === oldId);

      if (index === -1) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // If ID changed, handle directory rename
      if (oldId !== updatedGroup.id) {
        await storage.renameGroupDirectory(oldId, updatedGroup.id);
      }

      groups[index] = updatedGroup;
      await storage.saveGroups(groups);
      res.json(updatedGroup);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  // Update all groups
  app.post('/api/groups', async (req, res) => {
    try {
      const groups = req.body;
      // Ensure each group has a directory
      for (const group of groups) {
        await storage.createGroupDirectory(group.id);
      }
      await storage.saveGroups(groups);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update single group
  app.put('/api/groups/:id', async (req, res) => {
    try {
      const oldId = req.params.id;
      const updatedGroup = req.body;
      const groups = await storage.getGroups();
      const index = groups.findIndex(g => g.id === oldId);

      if (index === -1) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // If ID changed, handle directory rename
      if (oldId !== updatedGroup.id) {
        await storage.renameGroupDirectory(oldId, updatedGroup.id);
      } else {
        // Ensure directory exists even if ID hasn't changed
        await storage.createGroupDirectory(updatedGroup.id);
      }

      groups[index] = updatedGroup;
      await storage.saveGroups(groups);
      res.json(updatedGroup);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete group
  app.delete('/api/groups/:id', async (req, res) => {
    try {
      const groupId = req.params.id;
      const groups = await storage.getGroups();
      const filteredGroups = groups.filter(g => g.id !== groupId);

      if (filteredGroups.length === groups.length) {
        return res.status(404).json({ error: 'Group not found' });
      }

      await storage.deleteGroupDirectory(groupId);
      await storage.saveGroups(filteredGroups);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update groups
  app.post('/api/groups', async (req, res) => {
    try {
      await storage.saveGroups(req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add generation to group history
  app.post('/api/groups/:groupId/history', async (req, res) => {
    try {
      const { groupId } = req.params;
      const { fileName } = req.body;
      await storage.addGenerationToHistory(parseInt(groupId), fileName);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
