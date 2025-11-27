"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Camera,
  Upload,
  X,
  Plus,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Check,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  ZoomIn,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ============================================
// FIELD WORKER MODE PROVIDER
// ============================================
interface FieldModeContextValue {
  isFieldMode: boolean
  toggleFieldMode: () => void
  isOffline: boolean
  pendingSyncCount: number
}

const FieldModeContext = React.createContext<FieldModeContextValue>({
  isFieldMode: false,
  toggleFieldMode: () => {},
  isOffline: false,
  pendingSyncCount: 0,
})

export function useFieldMode() {
  return React.useContext(FieldModeContext)
}

interface FieldModeProviderProps {
  children: React.ReactNode
}

export function FieldModeProvider({ children }: FieldModeProviderProps) {
  const [isFieldMode, setIsFieldMode] = React.useState(false)
  const [isOffline, setIsOffline] = React.useState(false)
  const [pendingSyncCount, setPendingSyncCount] = React.useState(0)

  // Listen for online/offline events
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial status
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const toggleFieldMode = React.useCallback(() => {
    setIsFieldMode(prev => !prev)
  }, [])

  return (
    <FieldModeContext.Provider value={{ isFieldMode, toggleFieldMode, isOffline, pendingSyncCount }}>
      <div className={cn(isFieldMode && "field-mode")}>
        {children}
      </div>
    </FieldModeContext.Provider>
  )
}

// ============================================
// OFFLINE INDICATOR
// ============================================
interface OfflineIndicatorProps {
  className?: string
  showWhenOnline?: boolean
}

export function OfflineIndicator({ className, showWhenOnline = false }: OfflineIndicatorProps) {
  const { isOffline, pendingSyncCount } = useFieldMode()

  if (!isOffline && !showWhenOnline) return null

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
        isOffline
          ? "bg-warning-muted text-warning border border-warning/20"
          : "bg-success-muted text-success border border-success/20",
        className
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline Mode</span>
          {pendingSyncCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-warning text-white text-xs rounded-full">
              {pendingSyncCount} pending
            </span>
          )}
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          <span>Online</span>
        </>
      )}
    </div>
  )
}

// ============================================
// SYNC STATUS BADGE
// ============================================
interface SyncStatusBadgeProps {
  status: 'synced' | 'pending' | 'error' | 'syncing'
  className?: string
}

export function SyncStatusBadge({ status, className }: SyncStatusBadgeProps) {
  const statusConfig = {
    synced: {
      icon: Cloud,
      text: 'Synced',
      classes: 'bg-success-muted text-success',
    },
    pending: {
      icon: CloudOff,
      text: 'Pending',
      classes: 'bg-warning-muted text-warning',
    },
    error: {
      icon: AlertTriangle,
      text: 'Sync Error',
      classes: 'bg-danger-muted text-danger',
    },
    syncing: {
      icon: RefreshCw,
      text: 'Syncing',
      classes: 'bg-info-muted text-info',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
      config.classes,
      className
    )}>
      <Icon className={cn("h-3 w-3", status === 'syncing' && "animate-spin")} />
      <span>{config.text}</span>
    </div>
  )
}

// ============================================
// PHOTO CAPTURE COMPONENT
// ============================================
interface PhotoCaptureProps {
  /** Captured photos */
  photos: File[]
  /** Callback when photos change */
  onPhotosChange: (photos: File[]) => void
  /** Maximum number of photos */
  maxPhotos?: number
  /** Accept multiple photos at once */
  multiple?: boolean
  /** Show camera option */
  showCamera?: boolean
  /** Show gallery option */
  showGallery?: boolean
  /** Label text */
  label?: string
  /** Help text */
  helpText?: string
  /** Error message */
  error?: string
  /** Disabled state */
  disabled?: boolean
  /** Class name */
  className?: string
}

export function PhotoCapture({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  multiple = true,
  showCamera = true,
  showGallery = true,
  label = "Photos",
  helpText,
  error,
  disabled = false,
  className,
}: PhotoCaptureProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)
  const [previewPhoto, setPreviewPhoto] = React.useState<string | null>(null)

  const handleFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const availableSlots = maxPhotos - photos.length
    const newPhotos = files.slice(0, availableSlots)

    if (newPhotos.length > 0) {
      onPhotosChange([...photos, ...newPhotos])
    }

    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }, [photos, maxPhotos, onPhotosChange])

  const handleRemovePhoto = React.useCallback((index: number) => {
    const newPhotos = [...photos]
    newPhotos.splice(index, 1)
    onPhotosChange(newPhotos)
  }, [photos, onPhotosChange])

  const openPreview = React.useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setPreviewPhoto(url)
  }, [])

  const closePreview = React.useCallback(() => {
    if (previewPhoto) {
      URL.revokeObjectURL(previewPhoto)
    }
    setPreviewPhoto(null)
  }, [previewPhoto])

  const canAddMore = photos.length < maxPhotos && !disabled

  return (
    <div className={cn("space-y-3", className)}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          <span className="text-xs text-muted-foreground">
            {photos.length}/{maxPhotos}
          </span>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {/* Existing photos */}
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
          >
            <img
              src={URL.createObjectURL(photo)}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
              onLoad={(e) => {
                // Revoke URL after image loads to prevent memory leak
                URL.revokeObjectURL((e.target as HTMLImageElement).src)
              }}
            />

            {/* Overlay */}
            <div className={cn(
              "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100",
              "transition-opacity flex items-center justify-center gap-2"
            )}>
              <button
                onClick={() => openPreview(photo)}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                aria-label="View photo"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleRemovePhoto(index)}
                className="p-2 rounded-full bg-danger/80 text-white hover:bg-danger"
                aria-label="Remove photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Add photo buttons */}
        {canAddMore && (
          <>
            {showCamera && (
              <button
                onClick={() => cameraInputRef.current?.click()}
                className={cn(
                  "aspect-square rounded-xl",
                  "border-2 border-dashed border-border",
                  "flex flex-col items-center justify-center gap-1",
                  "text-muted-foreground hover:text-foreground",
                  "hover:border-construction/50 hover:bg-construction-50/50",
                  "dark:hover:bg-construction-500/10",
                  "transition-all duration-fast",
                  // Field worker optimized
                  "min-h-touch-xl"
                )}
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs font-medium">Camera</span>
              </button>
            )}

            {showGallery && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "aspect-square rounded-xl",
                  "border-2 border-dashed border-border",
                  "flex flex-col items-center justify-center gap-1",
                  "text-muted-foreground hover:text-foreground",
                  "hover:border-construction/50 hover:bg-construction-50/50",
                  "dark:hover:bg-construction-500/10",
                  "transition-all duration-fast",
                  // Field worker optimized
                  "min-h-touch-xl"
                )}
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs font-medium">Gallery</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Help text or error */}
      {(helpText || error) && (
        <p className={cn(
          "text-sm",
          error ? "text-danger" : "text-muted-foreground"
        )}>
          {error || helpText}
        </p>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileSelect}
        className="sr-only"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="sr-only"
      />

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <button
            onClick={closePreview}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewPhoto}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ============================================
// LARGE TOUCH BUTTON (Field Worker)
// ============================================
interface FieldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
  loading?: boolean
}

export const FieldButton = React.forwardRef<HTMLButtonElement, FieldButtonProps>(
  ({ className, variant = 'primary', icon, loading, children, disabled, ...props }, ref) => {
    const variantClasses = {
      primary: [
        "bg-gradient-construction text-white",
        "shadow-lg shadow-construction/30",
        "active:shadow-construction/50",
      ].join(" "),
      secondary: [
        "bg-surface-2 text-foreground border border-border",
        "dark:bg-surface-3",
      ].join(" "),
      success: [
        "bg-success text-white",
        "shadow-lg shadow-success/30",
      ].join(" "),
      warning: [
        "bg-warning text-white",
        "shadow-lg shadow-warning/30",
      ].join(" "),
      danger: [
        "bg-danger text-white",
        "shadow-lg shadow-danger/30",
      ].join(" "),
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Field worker optimized sizing
          "h-14 min-h-touch-xl px-6 py-4",
          "rounded-xl font-semibold text-base",
          "flex items-center justify-center gap-3",
          // Transitions
          "transition-all duration-fast ease-out",
          "active:scale-[0.97]",
          // Touch optimization
          "touch-manipulation select-none",
          // Disabled
          "disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <RefreshCw className="h-5 w-5 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        <span>{children}</span>
      </button>
    )
  }
)
FieldButton.displayName = "FieldButton"

// ============================================
// FIELD CARD (High Contrast)
// ============================================
interface FieldCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card status */
  status?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  /** Interactive/clickable */
  interactive?: boolean
  /** Selected state */
  selected?: boolean
}

export const FieldCard = React.forwardRef<HTMLDivElement, FieldCardProps>(
  ({ className, status = 'default', interactive, selected, children, ...props }, ref) => {
    const statusClasses = {
      default: "border-border bg-card dark:bg-surface-1",
      success: "border-success/30 bg-success-muted dark:bg-success/10",
      warning: "border-warning/30 bg-warning-muted dark:bg-warning/10",
      danger: "border-danger/30 bg-danger-muted dark:bg-danger/10",
      info: "border-info/30 bg-info-muted dark:bg-info/10",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border-2 p-4",
          statusClasses[status],
          interactive && [
            "cursor-pointer",
            "transition-all duration-fast",
            "active:scale-[0.98]",
            "hover:shadow-lg",
          ],
          selected && [
            "border-construction ring-2 ring-construction/20",
            "bg-construction-50 dark:bg-construction-500/10",
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FieldCard.displayName = "FieldCard"

// ============================================
// FIELD INPUT GROUP (High Contrast)
// ============================================
interface FieldInputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  error?: string
  required?: boolean
}

export const FieldInputGroup = React.forwardRef<HTMLDivElement, FieldInputGroupProps>(
  ({ className, label, error, required, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        <label className="block text-base font-semibold text-foreground">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
        {children}
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-danger font-medium">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    )
  }
)
FieldInputGroup.displayName = "FieldInputGroup"

// ============================================
// PROGRESS INDICATOR (Field Mode)
// ============================================
interface FieldProgressProps {
  current: number
  total: number
  label?: string
  className?: string
}

export function FieldProgress({ current, total, label, className }: FieldProgressProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label || 'Progress'}</span>
        <span className="text-muted-foreground">{current} of {total}</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-normal",
            percentage === 100
              ? "bg-success"
              : "bg-gradient-construction"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// CONFIRMATION ACTION (Field Mode)
// ============================================
interface ConfirmActionProps {
  label: string
  onConfirm: () => void
  onCancel?: () => void
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'success'
  className?: string
}

export function ConfirmAction({
  label,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = 'danger',
  className,
}: ConfirmActionProps) {
  const variantClasses = {
    danger: "bg-danger text-white",
    warning: "bg-warning text-white",
    success: "bg-success text-white",
  }

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-base font-medium text-center text-foreground">{label}</p>
      <div className="flex gap-3">
        {onCancel && (
          <FieldButton variant="secondary" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </FieldButton>
        )}
        <FieldButton
          variant={variant}
          onClick={onConfirm}
          className="flex-1"
          icon={<Check className="h-5 w-5" />}
        >
          {confirmLabel}
        </FieldButton>
      </div>
    </div>
  )
}

export {
  FieldModeContext,
}
