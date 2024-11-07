// src/ui/components/FileTree.jsx
import React from 'react'

export default function FileTree({ files }) {
  const handleDragStart = (e, file) => {
    e.dataTransfer.setData('file', file)
  }

  return (
    <div className='flex-1 overflow-hidden'>
      <div className='text-sm font-medium mb-2'>Available Files</div>
      <div className='border rounded bg-white overflow-y-auto h-[calc(100vh-24rem)]'>
        {files.map((file) => (
          <div
            key={file}
            draggable
            onDragStart={(e) => handleDragStart(e, file)}
            className='p-2 hover:bg-gray-100 cursor-move text-sm flex items-center'
          >
            <span className='truncate'>{file}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
