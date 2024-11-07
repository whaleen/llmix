// src/ui/components/ContentBox.jsx
import React, { useState } from 'react'

export default function ContentBox({
  box = { id: 0, name: '', files: [], description: '' },
  onUpdate = () => {},
  onRemove = () => {},
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

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
    if (!box.files.length) {
      setError('Please add at least one file')
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccess(false)

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
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate content')
      }

      const result = await response.json()
      setSuccess(true)
      console.log('Generated content:', result)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)

      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => setSuccess(false), 3000)
      }
    }
  }

  return (
    <div className='bg-white rounded-lg shadow p-4 flex flex-col'>
      <div className='flex justify-between items-center mb-4'>
        <input
          type='text'
          value={box.name}
          onChange={(e) => onUpdate({ ...box, name: e.target.value })}
          placeholder='Group name'
          className='font-medium text-lg border-none focus:ring-2 focus:ring-blue-500 rounded w-full mr-2'
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
        className={`flex-1 border-2 border-dashed rounded p-4 mb-4 min-h-[200px] overflow-y-auto transition-colors ${
          box.files.length ? 'border-gray-200' : 'border-gray-300'
        }`}
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

      {error && (
        <div className='text-red-500 text-sm mb-4 p-2 bg-red-50 rounded'>
          {error}
        </div>
      )}

      {success && (
        <div className='text-green-500 text-sm mb-4 p-2 bg-green-50 rounded'>
          Content generated successfully! Check your .llmix directory.
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !box.files.length}
        className={`p-3 rounded text-white font-medium transition-colors ${
          isGenerating || !box.files.length
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isGenerating ? 'Generating...' : 'Generate Content'}
      </button>
    </div>
  )
}
