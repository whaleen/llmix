// src/ui/App.jsx
import React, { useState, useEffect } from 'react'
import FileTree from './components/FileTree'
import ContentBox from './components/ContentBox'
import IgnoreConfig from './components/IgnoreConfig'

export default function App() {
  const [files, setFiles] = useState([])
  const [contentBoxes, setContentBoxes] = useState([
    { id: 1, name: 'Content Group 1', files: [], description: '' },
  ])
  const [config, setConfig] = useState(null)
  const [socket, setSocket] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [lastMessage, setLastMessage] = useState(null) // Debug: track last message

  useEffect(() => {
    // Fetch initial config
    fetch('/api/config')
      .then((res) => res.json())
      .then(setConfig)
      .catch((error) => console.error('Config fetch error:', error))

    // Setup WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}`)

    ws.onopen = () => {
      console.log('WebSocket connected') // Debug
      setConnectionStatus('connected')
      setSocket(ws)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected') // Debug
      setConnectionStatus('disconnected')
      // Try to reconnect after a delay
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error) // Debug
      setConnectionStatus('error')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Received WebSocket message:', data)

        if (data && data.type === 'files' && Array.isArray(data.files)) {
          // Filter out system files and ensure valid file names
          const validFiles = data.files.filter(
            (file) => typeof file === 'string' && !file.startsWith('.')
          )
          console.log('Setting files:', validFiles)
          setFiles(validFiles)
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
      }
    }

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const addNewBox = () => {
    setContentBoxes((boxes) => [
      ...boxes,
      {
        id: boxes.length + 1,
        name: `Content Group ${boxes.length + 1}`,
        files: [],
        description: '',
      },
    ])
  }

  return (
    <div className='flex h-screen bg-gray-100 p-4'>
      {process.env.NODE_ENV !== 'production' && (
        <div className='fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg text-sm z-50'>
          <div>Connection: {connectionStatus}</div>
          <div>Files: {files.length}</div>
          <div>
            Last message:{' '}
            {lastMessage ? JSON.stringify(lastMessage, null, 2) : 'none'}
          </div>
        </div>
      )}
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
        <IgnoreConfig config={config} />
        <FileTree files={files} />
      </div>

      <div className='flex-1 overflow-hidden'>
        <div className='mb-4'>
          <button
            onClick={addNewBox}
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            Add New Group
          </button>
        </div>

        <div className='grid grid-cols-2 gap-4 overflow-y-auto max-h-[calc(100vh-8rem)]'>
          {contentBoxes.map((box) => (
            <ContentBox
              key={box.id}
              box={box}
              onUpdate={(updatedBox) => {
                setContentBoxes((boxes) =>
                  boxes.map((b) => (b.id === updatedBox.id ? updatedBox : b))
                )
              }}
              onRemove={() => {
                setContentBoxes((boxes) => boxes.filter((b) => b.id !== box.id))
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
