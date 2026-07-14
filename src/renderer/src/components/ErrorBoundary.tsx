import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">应用加载出错</h2>
            </div>
            <div className="bg-red-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 font-medium mb-1">错误信息：</p>
              <p className="text-xs text-red-600 break-all">{this.state.error?.message || '未知错误'}</p>
            </div>
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700 mb-2">查看完整错误堆栈</summary>
              <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              className="mt-4 w-full py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}