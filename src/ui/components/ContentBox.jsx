// src/ui/components/ContentBox.jsx
import React, { useState, useEffect } from 'react'
import { Clock, Download, Edit2, Check } from 'lucide-react'
import { COLOR_OPTIONS, generateSlug } from '../App'

function formatDate(isoString) {
  return new Date(isoString).toLocaleString()
}

export default function ContentBox({
  box = {
    id: '',
    name: '',
    files: [],
    description: '',
    color: 'blue',
    history: [],
  },
  onUpdate = () => {},
  onRemove = () => {},
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isEditingSlug, setIsEditingSlug] = useState(false)
  const [tempSlug, setTempSlug] = useState(box.id)

  useEffect(() => {
    setTempSlug(box.id)
  }, [box.id])

  const handleSlugChange = (e) => {
    const newSlug = e.target.value
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
    setTempSlug(newSlug)
  }

  const handleSlugSave = () => {
    if (tempSlug && tempSlug !== box.id) {
      onUpdate({ ...box, id: tempSlug })
    }
    setIsEditingSlug(false)
  }

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

    try {
      const droppedFiles = JSON.parse(e.dataTransfer.getData('files'))
      const newFiles = [...new Set([...box.files, ...droppedFiles])]
      onUpdate({
        ...box,
        files: newFiles,
      })
    } catch (err) {
      // Fallback for single file drop
      const file = e.dataTransfer.getData('file')
      if (!box.files.includes(file)) {
        onUpdate({
          ...box,
          files: [...box.files, file],
        })
      }
    }
  }

  const removeFile = (fileToRemove) => {
    onUpdate({
      ...box,
      files: box.files.filter((file) => file !== fileToRemove),
    })
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
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
          groupId: box.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate content')
      }

      const result = await response.json()
      setSuccess(true)

      if (result.path) {
        const updatedHistory = [
          {
            fileName: result.path,
            timestamp: new Date().toISOString(),
          },
          ...(box.history || []),
        ]

        onUpdate({
          ...box,
          history: updatedHistory,
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className='bg-white rounded-lg shadow p-4 flex flex-col'>
      <div className='flex justify-between items-center mb-4'>
        <div className='flex-1 mr-4'>
          <input
            type='text'
            value={box.name}
            onChange={(e) => onUpdate({ ...box, name: e.target.value })}
            placeholder='Group name'
            className='font-medium text-lg border-none focus:ring-2 focus:ring-blue-500 rounded w-full'
          />
          {/* Slug editor */}
          <div className='flex items-center mt-1 text-sm text-gray-500'>
            <span className='mr-2'>Slug:</span>
            {isEditingSlug ? (
              <div className='flex items-center flex-1'>
                <input
                  type='text'
                  value={tempSlug}
                  onChange={handleSlugChange}
                  className='flex-1 px-1 py-0.5 border border-blue-300 rounded focus:outline-none focus:border-blue-500'
                  onKeyPress={(e) => e.key === 'Enter' && handleSlugSave()}
                  autoFocus
                />
                <button
                  onClick={handleSlugSave}
                  className='ml-2 p-1 text-blue-500 hover:text-blue-600'
                >
                  <Check className='w-4 h-4' />
                </button>
              </div>
            ) : (
              <div className='flex items-center'>
                <span className='text-gray-700'>{box.id}</span>
                <button
                  onClick={() => setIsEditingSlug(true)}
                  className='ml-2 p-1 text-gray-400 hover:text-blue-500'
                >
                  <Edit2 className='w-3 h-3' />
                </button>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            onRemove()
          }}
          type='button'
          className='text-red-500 hover:text-red-700'
        >
          Remove
        </button>
      </div>

      <div className='mb-4'>
        <select
          value={box.color || 'blue'}
          onChange={(e) => onUpdate({ ...box, color: e.target.value })}
          className='w-full p-2 border rounded'
        >
          {COLOR_OPTIONS.map(({ value, label }) => (
            <option
              key={value}
              value={value}
            >
              {label}
            </option>
          ))}
        </select>
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
                  onClick={(e) => {
                    e.preventDefault()
                    removeFile(file)
                  }}
                  type='button'
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
        type='button'
        disabled={isGenerating || !box.files.length}
        className={`p-3 rounded text-white font-medium transition-colors ${
          isGenerating || !box.files.length
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isGenerating ? 'Generating...' : 'Generate Content'}
      </button>

      {/* History Section */}
      {box.history && box.history.length > 0 && (
        <div className='mt-4 border-t pt-4'>
          <h3 className='text-sm font-medium text-gray-700 mb-2'>
            Generation History
          </h3>
          <div className='space-y-2 max-h-40 overflow-y-auto'>
            {box.history.map((item, index) => (
              <div
                key={index}
                className='flex items-center justify-between bg-gray-50 p-2 rounded text-sm'
              >
                <div className='flex items-center space-x-2'>
                  <Clock className='w-4 h-4 text-gray-400' />
                  <span className='text-gray-600'>
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                <a
                  href={`/.llmix/${item.fileName}`}
                  download
                  className='flex items-center space-x-1 text-blue-500 hover:text-blue-600'
                >
                  <Download className='w-4 h-4' />
                  <span>Download</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
