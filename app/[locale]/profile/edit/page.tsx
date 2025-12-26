'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MUSICAL_ROLES, GENRES, type Profile } from '@/types/profile';
import { updateProfile, getCurrentProfile } from '@/app/actions/profile';
import { Music, Upload, X } from 'lucide-react';
import { Sidebar } from '@/components/navigation/Sidebar';

export default function EditProfilePage() {
  const router = useRouter();
  const t = useTranslations('profile.edit');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [customRole, setCustomRole] = useState('');
  const [customGenre, setCustomGenre] = useState('');

  // Social links
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // File uploads
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  // Load current profile data
  useEffect(() => {
    loadProfileData();
  }, [router]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);

      const result = await getCurrentProfile();

      if (result.error || !result.profile) {
        if (result.error === 'Not authenticated') {
          router.push('/auth/login');
          return;
        }
        setError(result.error || 'Failed to load profile');
        setIsLoading(false);
        return;
      }

      const profileData = result.profile;
      setProfile(profileData);
      setDisplayName(profileData.display_name || '');
      setBio(profileData.bio || '');
      setSelectedRoles(profileData.musical_roles || []);
      setSelectedGenres(profileData.genres || []);
      setSoundcloudUrl(profileData.soundcloud_url || '');
      setInstagramUrl(profileData.instagram_url || '');
      setTwitterUrl(profileData.twitter_url || '');
      setYoutubeUrl(profileData.youtube_url || '');
      setWebsiteUrl(profileData.website_url || '');
      setIsPublic(profileData.is_public);
      setAvatarPreview(profileData.avatar_url || '');
      setBannerPreview(profileData.banner_url || '');
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const addCustomRole = () => {
    if (customRole.trim()) {
      setSelectedRoles(prev => [...prev, `Other: ${customRole.trim()}`]);
      setCustomRole('');
    }
  };

  const addCustomGenre = () => {
    if (customGenre.trim()) {
      setSelectedGenres(prev => [...prev, `Other: ${customGenre.trim()}`]);
      setCustomGenre('');
    }
  };

  const removeRole = (role: string) => {
    setSelectedRoles(prev => prev.filter(r => r !== role));
  };

  const removeGenre = (genre: string) => {
    setSelectedGenres(prev => prev.filter(g => g !== genre));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('display_name', displayName.trim());
      formData.append('bio', bio.trim());
      formData.append('musical_roles', JSON.stringify(selectedRoles));
      formData.append('genres', JSON.stringify(selectedGenres));
      formData.append('soundcloud_url', soundcloudUrl.trim());
      formData.append('instagram_url', instagramUrl.trim());
      formData.append('twitter_url', twitterUrl.trim());
      formData.append('youtube_url', youtubeUrl.trim());
      formData.append('website_url', websiteUrl.trim());
      formData.append('is_public', isPublic.toString());
      formData.append('current_avatar_url', profile?.avatar_url || '');
      formData.append('current_banner_url', profile?.banner_url || '');

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      const result = await updateProfile(formData);

      if (result.error) {
        setError(result.error);
        setIsSaving(false);
        return;
      }

      setSuccess(t('success'));
      setTimeout(() => {
        router.push(`/profile/${profile?.username}`);
      }, 1500);
    } catch (err) {
      setError(t('error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Sidebar username={profile?.username} />
        <main className="lg:ml-64">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black">
        <Sidebar />
        <main className="lg:ml-64">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-destructive">Profile not found</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar username={profile.username} />
      <main className="lg:ml-64">
        <div className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('title')}</CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="username">{t('username')}</Label>
                <Input
                  id="username"
                  value={profile.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">{t('usernameHint')}</p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('displayName')}</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('displayNamePlaceholder')}
                />
              </div>

              {/* Avatar */}
              <div className="space-y-2">
                <Label>{t('avatar')}</Label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Avatar"
                      width={80}
                      height={80}
                      className="rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 w-fit">
                        <Upload className="w-4 h-4" />
                        <span>{t('avatarChange')}</span>
                      </div>
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className="space-y-2">
                <Label>{t('banner')}</Label>
                <div className="space-y-4">
                  {bannerPreview ? (
                    <div className="relative w-full h-32 rounded-md overflow-hidden border-2 border-border">
                      <Image
                        src={bannerPreview}
                        alt="Banner"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-md bg-muted flex items-center justify-center border-2 border-border">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="banner" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 w-fit">
                        <Upload className="w-4 h-4" />
                        <span>{t('bannerChange')}</span>
                      </div>
                    </Label>
                    <Input
                      id="banner"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">{t('bio')}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('bioPlaceholder')}
                  rows={4}
                />
              </div>

              {/* Musical Roles */}
              <div className="space-y-2">
                <Label>{t('musicalRoles')}</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {MUSICAL_ROLES.map((role) => (
                    <Badge
                      key={role}
                      variant={selectedRoles.includes(role) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleRole(role)}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
                {selectedRoles.filter(r => r.startsWith('Other:')).map((role) => (
                  <Badge key={role} variant="secondary" className="mr-2 mb-2">
                    {role}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => removeRole(role)}
                    />
                  </Badge>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Other role..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRole())}
                  />
                  <Button type="button" onClick={addCustomRole} variant="secondary">
                    Add
                  </Button>
                </div>
              </div>

              {/* Genres */}
              <div className="space-y-2">
                <Label>{t('genres')}</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {GENRES.map((genre) => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
                {selectedGenres.filter(g => g.startsWith('Other:')).map((genre) => (
                  <Badge key={genre} variant="secondary" className="mr-2 mb-2">
                    {genre}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => removeGenre(genre)}
                    />
                  </Badge>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    placeholder="Other genre..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGenre())}
                  />
                  <Button type="button" onClick={addCustomGenre} variant="secondary">
                    Add
                  </Button>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('socialLinks')}</h3>

                <div className="space-y-2">
                  <Label htmlFor="soundcloud">{t('soundcloud')}</Label>
                  <Input
                    id="soundcloud"
                    type="url"
                    value={soundcloudUrl}
                    onChange={(e) => setSoundcloudUrl(e.target.value)}
                    placeholder="https://soundcloud.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">{t('instagram')}</Label>
                  <Input
                    id="instagram"
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">{t('twitter')}</Label>
                  <Input
                    id="twitter"
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">{t('youtube')}</Label>
                  <Input
                    id="youtube"
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">{t('website')}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('privacy')}</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isPublic">{t('publicProfile')}</Label>
                    <p className="text-sm text-muted-foreground">{t('publicProfileHint')}</p>
                  </div>
                  <Switch
                    id="isPublic"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-md bg-green-500/10 text-green-600 text-sm">
                  {success}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : t('submit')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/profile/${profile.username}`)}
                  disabled={isSaving}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
