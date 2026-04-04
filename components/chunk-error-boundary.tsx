'use client'
import React from 'react'

interface State { hasError: boolean }

export class ChunkErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch(error: Error) {
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      const alreadyRefreshed = sessionStorage.getItem('chunk-error-refreshed')
      if (!alreadyRefreshed) {
        sessionStorage.setItem('chunk-error-refreshed', 'true')
        window.location.reload()
        return
      }
    }
  }

  static getDerivedStateFromError(error: Error): State | null {
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      return { hasError: true }
    }
    throw error
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <p className="text-gray-600">Aplikace byla aktualizována.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Načíst znovu
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
