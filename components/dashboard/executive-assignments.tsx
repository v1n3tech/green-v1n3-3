'use client'

import { useState, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Clock, CheckCircle, XCircle, Users, ArrowRight,
  Loader2, MapPin, PenLine, Bell, X, Eye, Download
} from 'lucide-react'
import {
  fetchMyAssignments,
  fetchMyNotifications,
  fetchAssignmentLetter,
  markNotificationRead,
  updateAssignmentStatus,
  type ServiceAssignment,
  type ExecutiveNotification,
  type AssignmentLetter,
} from '@/lib/services/assignment-actions'

interface ExecutiveAssignmentsProps {
  userId: string
  displayName: string | null
  agroId: string | null
}

export function ExecutiveAssignments({
  userId,
  displayName,
  agroId,
}: ExecutiveAssignmentsProps) {
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([])
  const [notifications, setNotifications] = useState<ExecutiveNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [selectedLetter, setSelectedLetter] = useState<AssignmentLetter | null>(null)
  const [showLetterModal, setShowLetterModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [assignmentsRes, notificationsRes] = await Promise.all([
      fetchMyAssignments(),
      fetchMyNotifications({ unreadOnly: false, limit: 10 }),
    ])
    setAssignments(assignmentsRes.assignments)
    setNotifications(notificationsRes.notifications)
    setLoading(false)
  }

  async function handleViewLetter(assignment: ServiceAssignment) {
    const { letter } = await fetchAssignmentLetter(assignment.id)
    if (letter) {
      setSelectedLetter(letter)
      setShowLetterModal(true)
      
      // Mark notification as read if exists
      const notification = notifications.find(n => n.assignment_id === assignment.id)
      if (notification && !notification.is_read) {
        await markNotificationRead(notification.id)
        loadData()
      }
    }
  }

  async function handleUpdateStatus(assignmentId: string, status: 'accepted' | 'declined' | 'completed') {
    startTransition(async () => {
      await updateAssignmentStatus(assignmentId, status)
      loadData()
    })
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mono text-lg text-foreground">My Assignments</h2>
          <p className="mono-xs text-[10px] text-muted-foreground mt-1">
            View your service assignments and assignment letters
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange/10 border border-orange/30 rounded-[2px] text-orange mono-xs text-[9px]">
            <Bell className="w-3 h-3" />
            {unreadCount} NEW
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-card/50 border border-border rounded-[2px] p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="mono text-foreground mb-2">No Assignments Yet</h3>
          <p className="mono-xs text-[11px] text-muted-foreground">
            When you are assigned to service requests, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const notification = notifications.find(n => n.assignment_id === assignment.id)
            const isUnread = notification && !notification.is_read

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-[2px] p-4 bg-card/50 ${
                  isUnread ? 'border-orange' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-[2px] flex items-center justify-center flex-shrink-0 ${
                    isUnread 
                      ? 'bg-orange/10 border border-orange/30' 
                      : 'bg-primary/10 border border-primary/30'
                  }`}>
                    <FileText className={`w-5 h-5 ${isUnread ? 'text-orange' : 'text-primary'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="mono-sm text-sm text-foreground">
                          {notification?.title || 'Service Assignment'}
                        </h3>
                        <p className="mono-xs text-[10px] text-muted-foreground mt-0.5">
                          Assigned: {new Date(assignment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 border rounded-[2px] mono-xs text-[9px] ${
                        assignment.status === 'completed' ? 'text-primary bg-primary/10 border-primary/30' :
                        assignment.status === 'accepted' ? 'text-blue-500 bg-blue-500/10 border-blue-500/30' :
                        assignment.status === 'declined' ? 'text-destructive bg-destructive/10 border-destructive/30' :
                        'text-amber-500 bg-amber-500/10 border-amber-500/30'
                      }`}>
                        {assignment.status.toUpperCase()}
                      </span>
                    </div>

                    {assignment.role_description && (
                      <p className="text-xs text-foreground/80 mt-2">{assignment.role_description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => handleViewLetter(assignment)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-background mono-xs text-[9px] rounded-[2px] hover:bg-primary/90 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> VIEW LETTER
                      </button>

                      {assignment.status === 'assigned' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(assignment.id, 'accepted')}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary mono-xs text-[9px] rounded-[2px] hover:bg-primary/5 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" /> ACCEPT
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(assignment.id, 'declined')}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-destructive text-destructive mono-xs text-[9px] rounded-[2px] hover:bg-destructive/5 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" /> DECLINE
                          </button>
                        </>
                      )}

                      {assignment.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateStatus(assignment.id, 'completed')}
                          disabled={isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary mono-xs text-[9px] rounded-[2px] hover:bg-primary/5 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" /> MARK COMPLETE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Assignment Letter Modal */}
      <AnimatePresence>
        {showLetterModal && selectedLetter && (
          <AssignmentLetterModal
            letter={selectedLetter}
            onClose={() => {
              setShowLetterModal(false)
              setSelectedLetter(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ ASSIGNMENT LETTER MODAL ============
function AssignmentLetterModal({ letter, onClose }: { letter: AssignmentLetter; onClose: () => void }) {
  const content = letter.letter_content

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-background border border-border rounded-[2px] overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background">
          <div>
            <span className="mono-sm text-sm text-foreground">Assignment Letter</span>
            <p className="mono-xs text-[9px] text-muted-foreground">{letter.letter_reference}</p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Letterhead */}
          <div className="text-center mb-8 pb-6 border-b border-border">
            <h1 className="mono text-xl text-primary mb-2">AGROV1N3</h1>
            <p className="mono-xs text-[10px] text-muted-foreground">OFFICIAL ASSIGNMENT LETTER</p>
            <p className="mono-xs text-[9px] text-muted-foreground mt-1">
              Reference: {letter.letter_reference}
            </p>
          </div>

          {/* Letter Content */}
          <div className="space-y-6">
            <div>
              <p className="mono-xs text-[9px] text-muted-foreground mb-1">DATE</p>
              <p className="text-sm text-foreground">
                {new Date(content.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <p className="mono-xs text-[9px] text-muted-foreground mb-1">TO</p>
              <p className="text-sm text-foreground font-medium">{content.executiveName}</p>
              <p className="mono-xs text-[10px] text-muted-foreground">{content.executiveAgroId}</p>
            </div>

            <div>
              <p className="mono-xs text-[9px] text-muted-foreground mb-1">SUBJECT</p>
              <p className="text-sm text-foreground font-medium">
                Assignment for Service: {content.serviceName}
              </p>
            </div>

            <div className="bg-secondary/50 border border-border rounded-[2px] p-4">
              <p className="text-sm text-foreground leading-relaxed">
                Dear {content.executiveName},
              </p>
              <p className="text-sm text-foreground leading-relaxed mt-4">
                You are hereby assigned to execute the following service request on behalf of the{' '}
                <span className="text-primary">{content.communityName?.replace(/_/g, ' ').toUpperCase()}</span>{' '}
                community.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground mb-1">SERVICE</p>
                <p className="text-sm text-foreground">{content.serviceName}</p>
              </div>
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground mb-1">REQUESTER</p>
                <p className="text-sm text-foreground">{content.requesterName}</p>
              </div>
            </div>

            {content.serviceDescription && (
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground mb-1">SERVICE DESCRIPTION</p>
                <p className="text-sm text-foreground/80">{content.serviceDescription}</p>
              </div>
            )}

            {content.roleDescription && (
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground mb-1">YOUR ROLE</p>
                <p className="text-sm text-foreground">{content.roleDescription}</p>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/30 rounded-[2px] p-4">
              <p className="mono-xs text-[9px] text-primary mb-2">LOCATION DETAILS</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mono-xs text-[9px] text-muted-foreground">STATE</p>
                  <p className="text-sm text-foreground">{content.locationDetails?.state || 'N/A'}</p>
                </div>
                <div>
                  <p className="mono-xs text-[9px] text-muted-foreground">LGA</p>
                  <p className="text-sm text-foreground">{content.locationDetails?.lga || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="mono-xs text-[9px] text-muted-foreground">ADDRESS</p>
                  <p className="text-sm text-foreground">{content.locationDetails?.address || 'N/A'}</p>
                </div>
                {content.locationDetails?.details && (
                  <div className="col-span-2">
                    <p className="mono-xs text-[9px] text-muted-foreground">ADDITIONAL DETAILS</p>
                    <p className="text-sm text-foreground/80">{content.locationDetails.details}</p>
                  </div>
                )}
              </div>
            </div>

            {content.notes && (
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground mb-1">NOTES</p>
                <p className="text-sm text-foreground/80">{content.notes}</p>
              </div>
            )}

            {/* Signature */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-foreground mb-4">
                Please execute this assignment with diligence and professionalism.
              </p>
              <div>
                <p className="mono-xs text-[9px] text-muted-foreground mb-2">AUTHORIZED BY</p>
                <p className="text-sm text-foreground font-medium">{content.gcmName}</p>
                <p className="mono-xs text-[10px] text-muted-foreground">Green Community Manager</p>
                {content.gcmSignatureUrl && (
                  <div className="mt-3">
                    <img 
                      src={content.gcmSignatureUrl} 
                      alt="GCM Signature" 
                      className="max-h-16 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border sticky bottom-0 bg-background">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border text-muted-foreground mono-xs text-[10px] rounded-[2px] hover:bg-secondary transition-colors"
          >
            CLOSE
          </button>
        </div>
      </motion.div>
    </div>
  )
}
