'use client'

import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] px-6 py-12">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {this.props.fallbackTitle || 'Něco se pokazilo'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
            Při zobrazení stránky došlo k neočekávané chybě. Zkuste stránku obnovit.
          </p>
          {this.state.error && (
            <pre className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded px-3 py-2 max-w-lg overflow-auto mb-4">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Zkusit znovu
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
