// src/ui/components/IgnoreConfig.jsx
import React, { useState } from 'react'

export default function IgnoreConfig({ config = { ignore: [] } }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Format ignore patterns for display
  const defaultPatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '/(^|[\\/\\])\\../', // dotfiles pattern
  ]

  const configuredPatterns = config?.ignore || []
  const allPatterns = [...new Set([...defaultPatterns, ...configuredPatterns])]

  return (
    <div className='bg-white rounded-lg shadow mb-4 overflow-hidden'>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full p-4 text-left flex justify-between items-center hover:bg-gray-50'
      >
        <div className='flex items-center'>
          <span className='font-medium'>Ignored Patterns</span>
          <span className='ml-2 text-sm text-gray-500'>
            ({allPatterns.length})
          </span>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </button>

      {isExpanded && (
        <div className='px-4 pb-4'>
          <div className='text-sm text-gray-500 mb-2'>
            Files and directories matching these patterns will be ignored:
          </div>
          <div className='space-y-1'>
            {allPatterns.map((pattern, index) => (
              <div
                key={index}
                className='flex items-center text-sm py-1'
              >
                <span className='font-mono bg-gray-100 px-2 py-1 rounded flex-1'>
                  {pattern}
                </span>
                {configuredPatterns.includes(pattern) && (
                  <span className='ml-2 text-xs text-blue-500'>custom</span>
                )}
              </div>
            ))}
          </div>
          <div className='mt-4 text-xs text-gray-400'>
            To modify ignore patterns, update your llmix configuration file.
          </div>
        </div>
      )}
    </div>
  )
}
