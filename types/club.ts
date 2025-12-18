export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  genre: string;
  avatar_url: string | null;
  banner_url: string | null;
  rules: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  joined_at: string;
}

export interface ClubRequest {
  id: string;
  requested_genre: string;
  description: string | null;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ClubRequestVote {
  id: string;
  request_id: string;
  user_id: string;
  created_at: string;
}

export interface ClubWithStats extends Club {
  member_count: number;
  is_member: boolean;
}

export interface ClubRequestWithVotes extends ClubRequest {
  vote_count: number;
  has_voted: boolean;
}
