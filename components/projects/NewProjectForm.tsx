'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { createClubProject } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';

interface NewProjectFormProps {
  clubId: string;
  clubSlug: string;
  userId: string;
}

export function NewProjectForm({ clubId, clubSlug, userId }: NewProjectFormProps) {
  const router = useRouter();
  const t = useTranslations('projects.create');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('name') as string; // Form field is called 'name' but DB uses 'title'
    const description = formData.get('description') as string;

    try {
      // Create the project using server action
      const result = await createClubProject(clubId, title, description || undefined);

      if (!result.success) {
        throw new Error(result.error || t('error'));
      }

      // Project created successfully!
      console.log('Project created:', result.project);
      console.log('Redirecting to:', `/projects/${result.project.id}`);
      toast.success(t('success'));

      // Redirect to the newly created project
      const projectUrl = `/projects/${result.project.id}`;
      console.log('Calling router.push with:', projectUrl);
      router.push(projectUrl);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6 space-y-6">
        {/* Project Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
            {t('projectName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            maxLength={100}
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={t('projectNamePlaceholder')}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
            {t('description')}
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={500}
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder={t('descriptionPlaceholder')}
          />
          <p className="mt-2 text-xs text-gray-500">{t('descriptionOptional')}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? t('creating') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
