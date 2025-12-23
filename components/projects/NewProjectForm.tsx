'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface NewProjectFormProps {
  clubId: string;
  clubSlug: string;
  userId: string;
}

export function NewProjectForm({ clubId, clubSlug, userId }: NewProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('name') as string; // Form field is called 'name' but DB uses 'title'
    const description = formData.get('description') as string;

    try {
      const supabase = createClient();

      console.log('Creating project with data:', {
        club_id: clubId,
        title,
        description: description || null,
        owner_id: userId,
        kind: 'club',
      });

      // Create the project (trigger will automatically add creator as owner in project_members)
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          club_id: clubId,
          title,
          description: description || null,
          owner_id: userId,
          kind: 'club', // Club project (status defaults to 'active')
        })
        .select()
        .single();

      console.log('Project creation result:', { project, error: projectError });

      if (projectError) {
        console.error('Project creation error:', projectError);
        throw projectError;
      }

      if (!project) {
        throw new Error('Project was not created - no data returned');
      }

      // Project created successfully!
      // The trigger has automatically added the creator as owner in project_members
      toast.success('Project created successfully!');
      router.push(`/clubs/${clubSlug}`);
      router.refresh();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error creating project:', err);
      toast.error(err.message || 'Failed to create project');
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
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            maxLength={100}
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="My Awesome Track"
          />
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
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Describe your project..."
          />
          <p className="mt-2 text-xs text-gray-500">Optional - Add details about your project</p>
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
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
