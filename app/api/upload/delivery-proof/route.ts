import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Only field executives, logistics GCMs, and admins upload proof of delivery.
const PROOF_ROLES = ['agro_executive', 'gcm', 'admin']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !PROOF_ROLES.includes(profile.role || '')) {
      return NextResponse.json({ error: 'Not authorized to upload delivery proof' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 },
      )
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `delivery-proof/${user.id}-${Date.now()}.${extension}`

    const blob = await put(filename, file, { access: 'public' })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('[v0] Delivery proof upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
