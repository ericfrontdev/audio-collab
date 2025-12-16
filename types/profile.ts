// Profile types for AudioCollab

// Predefined musical roles (can be extended)
export const MUSICAL_ROLES = [
  'Producer',
  'Artist/Vocalist',
  'Audio Engineer',
  'Mixing Engineer',
  'Mastering Engineer',
  'Songwriter',
  'Guitarist',
  'Bassist',
  'Drummer',
  'Keyboardist',
  'Pianist',
  'DJ',
  'Beatmaker',
  'Composer',
  'Other', // User can specify custom role
] as const;

// Predefined genres (can be extended)
export const GENRES = [
  'Hip-Hop',
  'Lo-fi',
  'EDM',
  'House',
  'Techno',
  'Trap',
  'Drum & Bass',
  'Dubstep',
  'R&B',
  'Soul',
  'Funk',
  'Jazz',
  'Rock',
  'Indie',
  'Pop',
  'Electronic',
  'Ambient',
  'Experimental',
  'Classical',
  'Blues',
  'Country',
  'Reggae',
  'Latin',
  'Other', // User can specify custom genre
] as const;

export type MusicalRole = typeof MUSICAL_ROLES[number];
export type Genre = typeof GENRES[number];

// Database profile structure
export interface Profile {
  id: string; // UUID
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;

  // Arrays - can contain predefined values or "Other: Custom Value"
  musical_roles: string[];
  genres: string[];

  // Social links
  soundcloud_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  website_url: string | null;

  // Privacy
  is_public: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

// Form data for creating/updating profile
export interface ProfileFormData {
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  musical_roles: string[];
  genres: string[];
  soundcloud_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  website_url?: string;
  is_public: boolean;
}

// Helper functions

/**
 * Check if a role/genre entry is a custom "Other" value
 */
export function isCustomValue(value: string): boolean {
  return value.startsWith('Other: ');
}

/**
 * Extract custom value from "Other: xyz" format
 */
export function extractCustomValue(value: string): string | null {
  if (isCustomValue(value)) {
    return value.replace('Other: ', '');
  }
  return null;
}

/**
 * Format custom value as "Other: xyz"
 */
export function formatCustomValue(customValue: string): string {
  return `Other: ${customValue}`;
}

/**
 * Parse roles array into predefined and custom values
 */
export function parseRolesOrGenres(values: string[]): {
  predefined: string[];
  custom: string[];
} {
  const predefined: string[] = [];
  const custom: string[] = [];

  values.forEach(value => {
    if (isCustomValue(value)) {
      const customVal = extractCustomValue(value);
      if (customVal) custom.push(customVal);
    } else {
      predefined.push(value);
    }
  });

  return { predefined, custom };
}
