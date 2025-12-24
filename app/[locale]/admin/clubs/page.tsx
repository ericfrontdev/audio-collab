import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/routing'

export default async function AdminClubsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const t = await getTranslations('admin.clubs')

  // Fetch all clubs
  const { data: clubs } = await supabase
    .from('clubs')
    .select(`
      *,
      club_members (count)
    `)
    .order('name')

  // Batch fetch project counts for all clubs
  let projectCounts: Map<string, number> = new Map()
  if (clubs && clubs.length > 0) {
    const clubIds = clubs.map(c => c.id)
    const { data: projects } = await supabase
      .from('projects')
      .select('club_id')
      .in('club_id', clubIds)

    // Count projects per club
    projects?.forEach(project => {
      projectCounts.set(project.club_id, (projectCounts.get(project.club_id) || 0) + 1)
    })
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Link
            href={`/admin/clubs/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('newClub')}
          </Link>
        </div>

        {/* Clubs Table */}
        <div className="bg-card rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('table.slug')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('table.visibility')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('table.members')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('table.projects')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clubs?.map((club) => (
                  <tr key={club.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {club.cover_url && (
                          <img
                            src={club.cover_url}
                            alt={club.name}
                            className="h-10 w-10 rounded-full mr-3 object-cover"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-foreground">{club.name}</div>
                          {club.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {club.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {club.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        club.visibility === 'public'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {club.visibility}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {club.club_members?.[0]?.count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {projectCounts.get(club.id) || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link
                        href={`/clubs/${club.slug}`}
                        className="text-primary hover:text-primary/90"
                      >
                        {t('table.view')}
                      </Link>
                      <Link
                        href={`/admin/clubs/${club.id}/edit`}
                        className="text-primary hover:text-primary/90"
                      >
                        {t('table.edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!clubs || clubs.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      {t('noClubs')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
