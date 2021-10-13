import { Component, ErrorInfo, ReactNode, useCallback } from "react"

export interface ErrorBoundaryProps {
  children: ReactNode
  renderError: (error: Error) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

type ErrorBoundaryState =
  | {
      type: "error"
      error: Error
    }
  | {
      type: "ok"
    }

export class CustomErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      type: "ok",
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      type: "error",
      error,
    }
  }

  render() {
    if (this.state.type === "error") {
      return this.props.renderError(this.state.error)
    }

    return this.props.children
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }
}

export function ErrorView(props: { error?: Error; message?: ReactNode }) {
  const error = props.error
  const message = props.message || "Something went wrong"
  const handleReload = () => {
    window.location.reload()
  }
  return (
    <div className="error">
      <div className="row">
        <div>{message}</div>{" "}
        <button className="button small" onClick={handleReload}>
          Reload
        </button>
      </div>
      {error && (
        <pre>
          <code>
            {error.name}: {error.message}
          </code>
        </pre>
      )}
      <style jsx>{`
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-left: 4px;
        }
        .error {
          background: rgba(255, 0, 0, 0.1);
          padding: 8px;
          border-radius: 3px;
          flex: 1;
        }
      `}</style>
    </div>
  )
}

export function ErrorBoundary(props: { message?: ReactNode; children: ReactNode }) {
  const { message, children } = props
  const renderError = useCallback(() => <ErrorView message={message} />, [message])
  return <CustomErrorBoundary renderError={renderError}>{children}</CustomErrorBoundary>
}
