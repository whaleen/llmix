// src/ui/components/FileTree.jsx
import React from 'react'

export default function FileTree({ files = [] }) {
  if (!Array.isArray(files)) {
    console.warn('FileTree: files prop is not an array', files)
    return null
  }

  const handleDragStart = (e, file) => {
    e.dataTransfer.setData('file', file)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Filter out system files and ensure we have strings
  const filteredFiles = files.filter(
    (file) => typeof file === 'string' && !file.startsWith('.')
  )

  return (
    <div className='flex-1 overflow-hidden'>
      <div className='text-sm font-medium mb-2'>
        Available Files{' '}
        {filteredFiles.length ? `(${filteredFiles.length})` : ''}
      </div>
      <div className='border rounded bg-white overflow-y-auto h-[calc(100vh-24rem)]'>
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <div
              key={file}
              draggable
              onDragStart={(e) => handleDragStart(e, file)}
              className='p-2 hover:bg-gray-100 cursor-move text-sm flex items-center'
            >
              <span className='truncate'>{file}</span>
            </div>
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
