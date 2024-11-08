// src/ui/App.jsx
import React, { useState, useEffect } from 'react'
import FileTree from './components/FileTree'
import ContentBox from './components/ContentBox'
import IgnoreConfig from './components/IgnoreConfig'

// Define color options at the app level
export const COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'pink', label: 'Pink' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'teal', label: 'Teal' },
  { value: 'cyan', label: 'Cyan' },
]

// Helper function to generate slug
export function generateSlug(text, existingGroups = []) {
  let slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  if (existingGroups.some((group) => group.id === slug)) {
    let counter = 1
    let newSlug = slug
    while (existingGroups.some((group) => group.id === newSlug)) {
      newSlug = `${slug}-${counter}`
      counter++
    }
    slug = newSlug
  }

  return slug
}

export default function App() {
  const [files, setFiles] = useState([])
  const [contentBoxes, setContentBoxes] = useState([])
  const [config, setConfig] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [socket, setSocket] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // In App.jsx, update the initializeWebSocket function:

    const initializeWebSocket = () => {
      // Close existing socket if any
      if (socket) {
        socket.close()
      }

      // Use relative path and let the proxy handle it
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws`
      console.log('Connecting to WebSocket:', wsUrl)

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnectionStatus('connected')
        setError(null)
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event)
        setConnectionStatus('disconnected')
        // Try to reconnect after a delay
        setTimeout(initializeWebSocket, 3000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
        setConnectionStatus('error')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', data)
          if (data?.type === 'files' && Array.isArray(data.files)) {
            const validFiles = data.files.filter(
              (file) => typeof file === 'string' && !file.startsWith('.')
            )
            setFiles(validFiles)
          } else if (data?.type === 'groups' && Array.isArray(data.groups)) {
            setContentBoxes(data.groups)
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
        }
      }

      setSocket(ws)
    }

    // Initialize WebSocket connection
    initializeWebSocket()

    // Load initial data
    Promise.all([
      fetch('/api/groups').then((res) => res.json()),
      fetch('/api/config').then((res) => res.json()),
    ])
      .then(([groups, configData]) => {
        setContentBoxes(groups || [])
        setConfig(configData)
      })
      .catch((err) => {
        console.error('Error loading initial data:', err)
        setError('Failed to load initial data')
      })

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, []) // Empty dependency array - only run once on mount

  // Save groups whenever they change
  useEffect(() => {
    if (contentBoxes.length > 0) {
      fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentBoxes),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to save groups')
          }
        })
        .catch((error) => console.error('Error saving groups:', error))
    }
  }, [contentBoxes])

  const addNewBox = (e) => {
    e.preventDefault()
    const defaultName = `Content Group ${contentBoxes.length + 1}`
    const newGroup = {
      id: generateSlug(defaultName, contentBoxes),
      name: defaultName,
      files: [],
      description: '',
      color: COLOR_OPTIONS[contentBoxes.length % COLOR_OPTIONS.length].value,
      history: [],
    }

    setContentBoxes((prev) => [...prev, newGroup])
  }

  const handleGroupUpdate = (updatedBox) => {
    setContentBoxes((boxes) => {
      // If name changed, update the slug/id
      if (updatedBox.name !== boxes.find((b) => b.id === updatedBox.id)?.name) {
        updatedBox.id = generateSlug(
          updatedBox.name,
          boxes.filter((b) => b.id !== updatedBox.id)
        )
      }
      return boxes.map((b) => (b.id === updatedBox.id ? updatedBox : b))
    })
  }

  return (
    <div className='flex h-screen bg-gray-100 p-4'>
      <div className='w-80 mr-4 flex flex-col'>
        {connectionStatus !== 'connected' && (
          <div
            className={`mb-4 p-2 rounded text-sm ${
              connectionStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-800'
                : connectionStatus === 'disconnected'
                ? 'bg-red-100 text-red-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {connectionStatus === 'connecting'
              ? 'Connecting...'
              : connectionStatus === 'disconnected'
              ? 'Reconnecting...'
              : 'Connection error'}
          </div>
        )}

        {error && (
          <div className='mb-4 p-2 rounded bg-red-100 text-red-800 text-sm'>
            {error}
          </div>
        )}

        <IgnoreConfig config={config} />
        <FileTree
          files={files}
          contentBoxes={contentBoxes}
        />
      </div>

      <div className='flex-1 overflow-hidden'>
        <div className='mb-4'>
          <button
            onClick={addNewBox}
            type='button'
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-black'
          >
            Add New Group
          </button>
        </div>

        <div className='grid grid-cols-2 gap-4 overflow-y-auto max-h-[calc(100vh-8rem)]'>
          {Array.isArray(contentBoxes) &&
            contentBoxes.map((box) => (
              <ContentBox
                key={box.id}
                box={box}
                onUpdate={handleGroupUpdate}
                onRemove={() => {
                  setContentBoxes((boxes) =>
                    boxes.filter((b) => b.id !== box.id)
                  )
                }}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
