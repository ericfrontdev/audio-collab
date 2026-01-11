import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Link as LinkIcon, Instagram, Youtube, Users } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ProfilePosts } from '@/components/profile/ProfilePosts';
import { CreatePostCard } from '@/components/feed/CreatePostCard';
import { getProfilePosts } from '@/app/actions/feed';
import { getTranslations } from 'next-intl/server';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const t = await getTranslations('profile.view');
  const tGenres = await getTranslations('clubs.genres');
  const tStatus = await getTranslations('projects.status');
  const supabase = await createClient();

  // Fetch profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  // Check if private and not owner
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  if (!profile.is_public && !isOwner) {
    notFound();
  }

  // Fetch current user's profile for avatar
  let currentUserProfile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();
    currentUserProfile = data;
  }

  // Fetch profile posts (created by user + shared on their profile)
  const { posts } = await getProfilePosts(profile.id, 20, 0);

  // Fetch user's projects
  const { data: userProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(6); // Show first 6 projects

  // Fetch user's clubs
  interface ClubInfo {
    id: string;
    name: string;
    slug: string;
    genre: string | null;
    avatar_url: string | null;
  }

  interface UserClub extends ClubInfo {
    joined_at: string;
  }

  const { data: clubMemberships } = await supabase
    .from('club_members')
    .select('club_id, joined_at')
    .eq('user_id', profile.id)
    .order('joined_at', { ascending: false });

  let userClubs: UserClub[] = [];
  if (clubMemberships && clubMemberships.length > 0) {
    const clubIds = clubMemberships.map(m => m.club_id);
    const { data: clubs } = await supabase
      .from('clubs')
      .select('id, name, slug, genre, avatar_url')
      .in('id', clubIds);

    userClubs = clubMemberships.map(m => {
      const club = clubs?.find(c => c.id === m.club_id);
      return {
        ...club,
        joined_at: m.joined_at,
      } as UserClub;
    }).filter(c => c.id); // Remove any nulls
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-black pb-16">
        {/* Banner */}
        <div className="relative h-64 bg-gradient-to-r from-primary/20 to-purple-600/20">
          {profile.banner_url ? (
            <Image
              src={profile.banner_url}
              alt={t('banner')}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-600/20" />
          )}
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Avatar + Basic Info */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={128}
                  height={128}
                  className="rounded-full border-4 border-background object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-background bg-muted flex items-center justify-center">
                  <Music className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Name + Actions */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              {isOwner && (
                <Link href="/profile/edit">
                  <Button variant="outline">{t('editProfile')}</Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-6">
            <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Musical Roles */}
        {profile.musical_roles && profile.musical_roles.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              {t('roles')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.musical_roles.map((role: string) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Genres */}
        {profile.genres && profile.genres.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              {t('genres')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.genres.map((genre: string) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Clubs */}
        {userClubs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              {t('clubs')} ({userClubs.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {userClubs.map((club) => (
                <Link key={club.id} href={`/clubs/${club.slug}`}>
                  <div className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 transition-colors">
                    {club.avatar_url ? (
                      <Image
                        src={club.avatar_url}
                        alt={club.name}
                        width={20}
                        height={20}
                        className="rounded object-cover"
                      />
                    ) : (
                      <Users className="w-4 h-4 text-zinc-600" />
                    )}
                    <span className="text-sm text-white group-hover:text-primary transition-colors">
                      {tGenres(club.name as any) || club.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(profile.soundcloud_url ||
          profile.instagram_url ||
          profile.twitter_url ||
          profile.youtube_url ||
          profile.website_url) && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              {t('links')}
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.soundcloud_url && (
                <a
                  href={profile.soundcloud_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Music className="w-4 h-4" />
                  {t('soundcloud')}
                </a>
              )}
              {profile.instagram_url && (
                <a
                  href={profile.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  {t('instagram')}
                </a>
              )}
              {profile.twitter_url && (
                <a
                  href={profile.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  𝕏
                </a>
              )}
              {profile.youtube_url && (
                <a
                  href={profile.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                  {t('youtube')}
                </a>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  {t('website')}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">{t('posts')}</h2>

          {/* Create post card - only for profile owner */}
          {isOwner && user && (
            <div className="mb-4">
              <CreatePostCard
                userAvatar={profile.avatar_url}
                username={profile.username}
                userId={user.id}
              />
            </div>
          )}

          <ProfilePosts
            initialPosts={posts}
            currentUserId={user?.id}
            currentUserAvatar={currentUserProfile?.avatar_url}
          />
        </div>

        {/* Projects */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">{t('projects')}</h2>
          {userProjects && userProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="group overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
                    <div className="relative h-32 bg-gradient-to-br from-primary/20 to-purple-600/20">
                      {project.cover_url && (
                        <Image
                          src={project.cover_url}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      )}
                      {project.status && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {tStatus(project.status as any) || project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {t('noProjects')} {isOwner && t('createFirstProject')}
              </p>
            </Card>
          )}
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
