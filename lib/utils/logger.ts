/**
 * Structured Logging Utility
 *
 * Provides consistent, structured logging throughout the application
 * with support for different log levels and contexts.
 *
 * Benefits:
 * - Prevents sensitive data leakage in production
 * - Structured logs for easy parsing/searching
 * - Contextual information for debugging
 * - Environment-aware (different behavior in dev vs prod)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

type LogContext = {
  userId?: string
  orgId?: string
  projectId?: string
  action?: string
  component?: string
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  environment: string
}

class Logger {
  private environment: string

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
  }

  /**
   * Check if logging is enabled for this level
   */
  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.environment === 'production') {
      return ['warn', 'error', 'fatal'].includes(level)
    }
    // In development, log everything
    return true
  }

  /**
   * Sanitize context to prevent sensitive data leakage
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined

    const sanitized = { ...context }

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard']
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }

  /**
   * Format and output log entry
   */
  private output(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) return

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      context: this.sanitizeContext(context),
    }

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: this.environment === 'development' ? error.stack : undefined,
      }
    }

    // In development, use console with colors
    if (this.environment === 'development') {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
        fatal: '\x1b[35m', // Magenta
      }
      const reset = '\x1b[0m'

      console.log(`${colors[level]}[${level.toUpperCase()}]${reset} ${message}`)

      if (context) {
        console.log('Context:', context)
      }

      if (error) {
        console.error(error)
      }
    } else {
      // In production, output structured JSON for log aggregation tools
      console.log(JSON.stringify(logEntry))
    }

    // TODO: Send to external logging service (Sentry, LogRocket, DataDog)
    // this.sendToExternalService(logEntry)
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext) {
    this.output('debug', message, context)
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext) {
    this.output('info', message, context)
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext) {
    this.output('warn', message, context)
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error, context?: LogContext) {
    this.output('error', message, context, error)
  }

  /**
   * Log fatal errors that require immediate attention
   */
  fatal(message: string, error?: Error, context?: LogContext) {
    this.output('fatal', message, context, error)

    // TODO: Send alert/notification for fatal errors
  }

  /**
   * Log Server Action execution
   */
  action(actionName: string, status: 'start' | 'success' | 'error', context?: LogContext, error?: Error) {
    const message = `Server Action: ${actionName} - ${status}`
    const actionContext = { ...context, action: actionName }

    if (status === 'error') {
      this.error(message, error, actionContext)
    } else {
      this.info(message, actionContext)
    }
  }

  /**
   * Log authentication events
   */
  auth(event: string, userId?: string, context?: LogContext) {
    this.info(`Auth: ${event}`, { ...context, userId })
  }

  /**
   * Log database queries (development only)
   */
  query(queryName: string, duration: number, context?: LogContext) {
    if (this.environment === 'development') {
      this.debug(`DB Query: ${queryName} (${duration}ms)`, context)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for external use
export type { LogLevel, LogContext }
