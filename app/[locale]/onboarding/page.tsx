'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MUSICAL_ROLES, GENRES } from '@/types/profile';
import { createProfile } from '@/app/actions/profile';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Profile data
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug: Check if user is authenticated and has profile
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      if (!user) {
        console.error('No user found on client side!');
        return;
      }

      // Check if user already has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        console.log('User already has a profile, redirecting to feed');
        router.push('/feed');
      }
    };
    checkAuth();
  }, [router]);

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

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate and save profile
      if (!username.trim()) {
        setError(t('errors.usernameRequired'));
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('username', username.trim());
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

        if (avatarFile) {
          formData.append('avatar', avatarFile);
        }

        const result = await createProfile(formData);

        if (result.error) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        setCurrentStep(2);
      } catch (err) {
        setError(t('errors.somethingWentWrong'));
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else if (currentStep === 2) {
      // Save clubs selection
      // TODO: Save clubs to Supabase
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Redirect based on choice
      router.push('/feed');
    }
  };

  const handleSkip = () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto py-8">
        {/* Header with Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image
            src="/images/AC_Logo.webp"
            alt="AudioCollab"
            width={40}
            height={40}
            className="object-contain"
            unoptimized
          />
          <span className="text-xl font-bold text-foreground">AudioCollab</span>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{t('stepLabels.createProfile')}</span>
            <span>{t('stepLabels.joinClubs')}</span>
            <span>{t('stepLabels.getStarted')}</span>
          </div>
        </div>

        {/* Step 1: Create Profile */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('step1.title')}</CardTitle>
                <CardDescription>
                  {t('step1.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                    {error}
                  </div>
                )}

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">
                    {t('step1.username')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('step1.usernameDescription')}
                  </p>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t('step1.displayName')}</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('step1.displayNamePlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('step1.displayNameDescription')}
                  </p>
                </div>

                {/* Avatar Upload */}
                <div className="space-y-2">
                  <Label htmlFor="avatar">{t('step1.profilePicture')}</Label>
                  <div className="flex items-center gap-4">
                    {avatarPreview && (
                      <img
                        src={avatarPreview}
                        alt={t('step1.avatarPreview')}
                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('step1.uploadPicture')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">{t('step1.bio')}</Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('step1.bioPlaceholder')}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Musical Roles */}
                <div className="space-y-3">
                  <Label>{t('step1.musicalRoles')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {MUSICAL_ROLES.filter(role => role !== 'Other').map((role) => (
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
                  {/* Custom role */}
                  <div className="flex gap-2">
                    <Input
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder={t('step1.addCustomRole')}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRole())}
                    />
                    <Button type="button" onClick={addCustomRole} variant="secondary">
                      {t('step1.add')}
                    </Button>
                  </div>
                  {/* Selected roles */}
                  {selectedRoles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRoles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                          <button
                            onClick={() => setSelectedRoles(prev => prev.filter(r => r !== role))}
                            className="ml-2 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Genres */}
                <div className="space-y-3">
                  <Label>{t('step1.genres')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.filter(genre => genre !== 'Other').map((genre) => (
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
                  {/* Custom genre */}
                  <div className="flex gap-2">
                    <Input
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      placeholder={t('step1.addCustomGenre')}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGenre())}
                    />
                    <Button type="button" onClick={addCustomGenre} variant="secondary">
                      {t('step1.add')}
                    </Button>
                  </div>
                  {/* Selected genres */}
                  {selectedGenres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedGenres.map((genre) => (
                        <Badge key={genre} variant="secondary">
                          {genre}
                          <button
                            onClick={() => setSelectedGenres(prev => prev.filter(g => g !== genre))}
                            className="ml-2 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Links Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('step1.socialLinks')}</CardTitle>
                <CardDescription>{t('step1.socialLinksDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="soundcloud">{t('step1.soundcloud')}</Label>
                  <Input
                    id="soundcloud"
                    value={soundcloudUrl}
                    onChange={(e) => setSoundcloudUrl(e.target.value)}
                    placeholder="https://soundcloud.com/yourname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">{t('step1.instagram')}</Label>
                  <Input
                    id="instagram"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/yourname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">{t('step1.twitter')}</Label>
                  <Input
                    id="twitter"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://x.com/yourname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">{t('step1.youtube')}</Label>
                  <Input
                    id="youtube"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@yourname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">{t('step1.website')}</Label>
                  <Input
                    id="website"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleNext} size="lg" disabled={isLoading}>
                {isLoading ? t('step1.creatingProfile') : t('step1.nextJoinClubs')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Join Clubs */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('step2.title')}</CardTitle>
              <CardDescription>
                {t('step2.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('step2.comingSoon')}</p>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleSkip} variant="outline">
                  {t('step2.skipForNow')}
                </Button>
                <Button onClick={handleNext}>{t('step2.nextGetStarted')}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Get Started */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>{t('step3.createFirstProject')}</CardTitle>
                <CardDescription>
                  {t('step3.createProjectDescription')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>{t('step3.exploreFeed')}</CardTitle>
                <CardDescription>
                  {t('step3.exploreFeedDescription')}
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="flex justify-center mt-6">
              <Button onClick={handleNext} size="lg">
                {t('step3.enterAudioCollab')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
