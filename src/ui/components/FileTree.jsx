// src/ui/components/FileTree.jsx
import React, { useMemo, useState, useCallback } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
} from 'lucide-react'

// Define color classes directly in FileTree to avoid circular dependency
const getColorClass = (colorName) => {
  const colorMap = {
    blue: 'bg-blue-200',
    green: 'bg-green-200',
    purple: 'bg-purple-200',
    yellow: 'bg-yellow-200',
    pink: 'bg-pink-200',
    indigo: 'bg-indigo-200',
    red: 'bg-red-200',
    orange: 'bg-orange-200',
    teal: 'bg-teal-200',
    cyan: 'bg-cyan-200',
  }
  return colorMap[colorName] || 'bg-gray-200'
}

const FileTree = ({ files = [], contentBoxes = [] }) => {
  const [expandedPaths, setExpandedPaths] = useState(new Set())
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [selectionStart, setSelectionStart] = useState(null)

  // Create a map of files to their group colors
  const fileGroupColors = useMemo(() => {
    const colorMap = new Map()

    contentBoxes.forEach((box) => {
      box.files.forEach((file) => {
        if (!colorMap.has(file)) {
          colorMap.set(file, [])
        }
        colorMap.get(file).push({
          color: box.color || 'blue',
          groupName: box.name,
        })
      })
    })
    return colorMap
  }, [contentBoxes])

  // Convert flat file list to tree structure
  const fileTree = useMemo(() => {
    const tree = {}

    files.forEach((filePath) => {
      const parts = filePath.split('/')
      let current = tree

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = { type: 'file', name: part, path: filePath }
        } else {
          current[part] = current[part] || {
            type: 'directory',
            name: part,
            children: {},
            path: parts.slice(0, index + 1).join('/'),
          }
          current = current[part].children
        }
      })
    })

    return tree
  }, [files])

  const toggleExpanded = useCallback((path) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleFileSelect = useCallback(
    (path, e) => {
      if (e.shiftKey && selectionStart) {
        // Find the indices of the start and current files
        const fileList = files
        const startIdx = fileList.indexOf(selectionStart)
        const endIdx = fileList.indexOf(path)

        // Select all files between start and end
        const newSelection = new Set(selectedFiles)
        const [min, max] = [
          Math.min(startIdx, endIdx),
          Math.max(startIdx, endIdx),
        ]
        for (let i = min; i <= max; i++) {
          newSelection.add(fileList[i])
        }
        setSelectedFiles(newSelection)
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle single file selection
        setSelectedFiles((prev) => {
          const next = new Set(prev)
          if (next.has(path)) {
            next.delete(path)
          } else {
            next.add(path)
          }
          return next
        })
        setSelectionStart(path)
      } else {
        // Single file selection
        setSelectedFiles(new Set([path]))
        setSelectionStart(path)
      }
    },
    [files, selectedFiles, selectionStart]
  )

  const handleDragStart = (e) => {
    // Use selected files if the dragged file is part of the selection,
    // otherwise just drag the single file
    const draggedPath = e.target.dataset.path
    const filesToDrag = selectedFiles.has(draggedPath)
      ? Array.from(selectedFiles)
      : [draggedPath]

    e.dataTransfer.setData('files', JSON.stringify(filesToDrag))
    e.dataTransfer.effectAllowed = 'move'
  }

  const TreeNode = ({ node, level = 0 }) => {
    const isExpanded = expandedPaths.has(node.path)
    const groupColors = fileGroupColors.get(node.path) || []
    const isSelected = selectedFiles.has(node.path)

    if (node.type === 'file') {
      return (
        <div
          draggable
          data-path={node.path}
          onDragStart={handleDragStart}
          onClick={(e) => handleFileSelect(node.path, e)}
          className={`flex items-center p-2 hover:bg-gray-100 cursor-move text-sm
            ${isSelected ? 'bg-blue-50' : ''}`}
          style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}
        >
          <File className='w-5 h-5 mr-2 text-gray-500' />
          <span className='truncate flex-1'>{node.name}</span>
          {groupColors.length > 0 && (
            <div className='flex space-x-1'>
              {groupColors.map(({ color, groupName }, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${getColorClass(color)}`}
                  title={groupName}
                />
              ))}
            </div>
          )}
        </div>
      )
    }

    const sortedChildren = Object.values(node.children).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return (
      <div>
        <div
          onClick={() => toggleExpanded(node.path)}
          className='flex items-center p-2 hover:bg-gray-50 cursor-pointer text-sm'
          style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          {isExpanded ? (
            <ChevronDown className='w-5 h-5 mr-2 text-gray-400' />
          ) : (
            <ChevronRight className='w-5 h-5 mr-2 text-gray-400' />
          )}
          {isExpanded ? (
            <FolderOpen className='w-5 h-5 mr-2 text-blue-500' />
          ) : (
            <Folder className='w-5 h-5 mr-2 text-blue-500' />
          )}
          <span className='font-medium'>{node.name}</span>
        </div>

        {isExpanded &&
          sortedChildren.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
            />
          ))}
      </div>
    )
  }

  const rootNodes = Object.values(fileTree).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className='flex-1 overflow-hidden'>
      <div className='text-sm font-medium mb-2 flex justify-between items-center'>
        <span>Available Files {files.length ? `(${files.length})` : ''}</span>
        {selectedFiles.size > 0 && (
          <span className='text-blue-500'>{selectedFiles.size} selected</span>
        )}
      </div>
      <div className='border rounded bg-white overflow-y-auto h-[calc(100vh-24rem)]'>
        {rootNodes.length > 0 ? (
          rootNodes.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
            />
          ))
        ) : (
          <div className='p-4 text-gray-500 text-sm text-center'>
            No files available
          </div>
        )}
      </div>
    </div>
  )
}

export default FileTree
