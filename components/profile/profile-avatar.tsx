'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Loader2, X, Check, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProfileAvatarProps {
  currentAvatar: string | null
  displayName: string
}

function initialsFor(name: string) {
  const parts = name.split(/[_\s\-.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function ProfileAvatar({ currentAvatar, displayName }: ProfileAvatarProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showUploadHint, setShowUploadHint] = useState(false)

  const handleFileSelect = async (file: File) => {
    setError(null)
    setSuccess(false)

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File too large (max 5MB)')
      return
    }

    // Create preview
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)

    // Upload file
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setSuccess(true)
      
      // Refresh the page to show updated avatar
      setTimeout(() => {
        router.refresh()
      }, 1000)

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp,image/gif'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    }
    input.click()
  }

  const currentImage = previewUrl || currentAvatar

  return (
    <div className="relative shrink-0">
      <div
        className={`relative group cursor-pointer ${isDragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-[2px]' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseEnter={() => setShowUploadHint(true)}
        onMouseLeave={() => setShowUploadHint(false)}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-[2px]" />
        
        {/* Avatar */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[2px] overflow-hidden border border-primary/40 bg-primary/10">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={displayName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center mono text-primary text-xl sm:text-2xl font-bold tracking-wider">
              {initialsFor(displayName)}
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : success ? (
              <Check className="w-6 h-6 text-primary" />
            ) : (
              <>
                <Camera className="w-5 h-5 text-primary mb-1" />
                <span className="mono-xs text-primary text-[8px]">UPLOAD</span>
              </>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-background border border-primary/50 rounded-full flex items-center justify-center"
            >
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            </motion.div>
          )}
          {success && !isUploading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
            >
              <Check className="w-3.5 h-3.5 text-background" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute -bottom-8 left-0 right-0 flex items-center gap-1 justify-center"
          >
            <X className="w-3 h-3 text-destructive" />
            <span className="mono-xs text-destructive text-[9px]">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
