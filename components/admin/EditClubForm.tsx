'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  genre: string;
  rules: string | null;
  avatar_url: string | null;
  banner_url: string | null;
}

export function EditClubForm({ club }: { club: Club }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(club.avatar_url);
  const [bannerPreview, setBannerPreview] = useState<string | null>(club.banner_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const genre = formData.get('genre') as string;
    const rules = formData.get('rules') as string;

    try {
      const supabase = createClient();

      let avatar_url = club.avatar_url;
      let banner_url = club.banner_url;

      // Upload new avatar if provided
      if (avatarFile) {
        const avatarExt = avatarFile.name.split('.').pop();
        const avatarPath = `clubs/avatars/${club.id}-${Date.now()}.${avatarExt}`;

        const { error: avatarError } = await supabase.storage
          .from('clubs')
          .upload(avatarPath, avatarFile);

        if (avatarError) {
          console.error('Avatar upload error:', avatarError);
          toast.error('Failed to upload avatar');
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('clubs')
            .getPublicUrl(avatarPath);
          avatar_url = publicUrl;
        }
      }

      // Upload new banner if provided
      if (bannerFile) {
        const bannerExt = bannerFile.name.split('.').pop();
        const bannerPath = `clubs/banners/${club.id}-${Date.now()}.${bannerExt}`;

        const { error: bannerError } = await supabase.storage
          .from('clubs')
          .upload(bannerPath, bannerFile);

        if (bannerError) {
          console.error('Banner upload error:', bannerError);
          toast.error('Failed to upload banner');
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('clubs')
            .getPublicUrl(bannerPath);
          banner_url = publicUrl;
        }
      }

      // Update the club
      const { error } = await supabase
        .from('clubs')
        .update({
          name,
          slug: slug.toLowerCase(),
          description: description || null,
          genre,
          rules: rules || null,
          avatar_url,
          banner_url,
        })
        .eq('id', club.id);

      if (error) throw error;

      toast.success('Club updated successfully!');
      router.push('/admin/clubs');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating club:', error);
      toast.error(error.message || 'Failed to update club');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6 space-y-6">
        {/* Club Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
            Club Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            maxLength={100}
            defaultValue={club.name}
            placeholder="e.g., Blues, Jazz, Rock"
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">The name of the musical genre or style</p>
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-white mb-2">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            maxLength={100}
            pattern="[a-z0-9-]+"
            defaultValue={club.slug}
            placeholder="e.g., blues, jazz, rock"
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            URL-friendly identifier (lowercase, no spaces, use hyphens)
          </p>
        </div>

        {/* Genre */}
        <div>
          <label htmlFor="genre" className="block text-sm font-medium text-white mb-2">
            Genre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="genre"
            name="genre"
            required
            maxLength={50}
            defaultValue={club.genre}
            placeholder="e.g., Blues, Jazz, Rock"
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">The primary musical genre</p>
        </div>

        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Club Avatar
          </label>
          <div className="flex items-start gap-4">
            {avatarPreview ? (
              <div className="relative">
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  width={120}
                  height={120}
                  className="rounded-lg object-cover border-2 border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview(null);
                    setAvatarFile(null);
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 text-gray-500 mb-2" />
                <span className="text-xs text-gray-500">Upload Avatar</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-400">
                Square image recommended (e.g., 500x500px)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max size: 2MB. Formats: JPG, PNG, WEBP
              </p>
            </div>
          </div>
        </div>

        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Club Banner
          </label>
          <div className="flex flex-col gap-4">
            {bannerPreview ? (
              <div className="relative">
                <Image
                  src={bannerPreview}
                  alt="Banner preview"
                  width={600}
                  height={200}
                  className="rounded-lg object-cover border-2 border-zinc-700 w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    setBannerPreview(null);
                    setBannerFile(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 text-gray-500 mb-2" />
                <span className="text-xs text-gray-500">Upload Banner</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
              </label>
            )}
            <div>
              <p className="text-sm text-gray-400">
                Wide image recommended (e.g., 1200x400px)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max size: 2MB. Formats: JPG, PNG, WEBP
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={500}
            defaultValue={club.description || ''}
            placeholder="Describe this musical genre..."
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        {/* Rules */}
        <div>
          <label htmlFor="rules" className="block text-sm font-medium text-white mb-2">
            Rules
          </label>
          <textarea
            id="rules"
            name="rules"
            rows={4}
            maxLength={1000}
            defaultValue={club.rules || ''}
            placeholder="Club rules and guidelines..."
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/clubs')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? 'Updating...' : 'Update Club'}
        </Button>
      </div>
    </form>
  );
}
