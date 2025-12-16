import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Link as LinkIcon, Instagram, Youtube } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-primary/20 to-purple-600/20">
        {profile.banner_url ? (
          <Image
            src={profile.banner_url}
            alt="Profile banner"
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
                  <Button variant="outline">Edit Profile</Button>
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
              ROLES
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
              GENRES
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

        {/* Social Links */}
        {(profile.soundcloud_url ||
          profile.instagram_url ||
          profile.twitter_url ||
          profile.youtube_url ||
          profile.website_url) && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              LINKS
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
                  SoundCloud
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
                  Instagram
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
                  YouTube
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
                  Website
                </a>
              )}
            </div>
          </div>
        )}

        {/* Projects Placeholder */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Projects</h2>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No projects yet. Create your first project!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
