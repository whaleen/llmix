// src/ui/components/ContentBox.jsx
import React, { useState } from 'react'

export default function ContentBox({
  box = { id: 0, name: '', files: [], description: '' },
  onUpdate = () => {},
  onRemove = () => {},
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add('border-blue-500')
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('border-blue-500')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('border-blue-500')

    const file = e.dataTransfer.getData('file')
    if (!box.files.includes(file)) {
      onUpdate({
        ...box,
        files: [...box.files, file],
      })
    }
  }

  const removeFile = (fileToRemove) => {
    onUpdate({
      ...box,
      files: box.files.filter((file) => file !== fileToRemove),
    })
  }

  const handleGenerate = async () => {
    if (!box.files.length) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: box.files,
          name: box.name,
          description: box.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const result = await response.json()
      // Could show success message or do something with result.path
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className='bg-white rounded-lg shadow p-4 flex flex-col'>
      <div className='flex justify-between items-center mb-4'>
        <input
          type='text'
          value={box.name}
          onChange={(e) => onUpdate({ ...box, name: e.target.value })}
          className='font-medium text-lg border-none focus:ring-2 focus:ring-blue-500 rounded'
        />
        <button
          onClick={onRemove}
          className='text-red-500 hover:text-red-700'
        >
          Remove
        </button>
      </div>

      <textarea
        placeholder='Description (optional)'
        value={box.description}
        onChange={(e) => onUpdate({ ...box, description: e.target.value })}
        className='w-full p-2 mb-4 border rounded resize-none h-20'
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className='flex-1 border-2 border-dashed rounded p-4 mb-4 min-h-[200px] overflow-y-auto transition-colors'
      >
        {box.files.length === 0 ? (
          <div className='text-gray-400 text-center'>Drag files here</div>
        ) : (
          <div className='space-y-2'>
            {box.files.map((file) => (
              <div
                key={file}
                className='flex justify-between items-center bg-gray-50 p-2 rounded text-sm'
              >
                <span className='truncate flex-1'>{file}</span>
                <button
                  onClick={() => removeFile(file)}
                  className='ml-2 text-red-500 hover:text-red-700'
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className='text-red-500 text-sm mb-4'>{error}</div>}

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !box.files.length}
        className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
      >
        {isGenerating ? 'Generating...' : 'Generate Content'}
      </button>
    </div>
  )
}
