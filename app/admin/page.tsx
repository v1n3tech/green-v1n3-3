import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export const metadata = {
  title: 'Admin — GreenV1n3',
  description: 'Administrative control panel for GreenV1n3 platform.',
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, display_name, email, agro_id')
    .eq('id', user.id)
    .single()

  // Only allow admin access
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch stats for the admin dashboard
  const [
    { count: totalUsers },
    { count: pendingVerifications },
    { count: activeExecutives },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'agro_executive').eq('is_active', true),
  ])

  const stats = {
    totalUsers: totalUsers ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    activeExecutives: activeExecutives ?? 0,
  }

  return (
    <AdminDashboard 
      profile={{
        displayName: profile.display_name,
        email: profile.email,
        agroId: profile.agro_id,
      }}
      stats={stats}
    />
  )
}
