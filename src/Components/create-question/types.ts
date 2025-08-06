export interface PersonalCollaborator {
  id: number;
  username: string;
  profile_picture?: string;
  division?: string;
}

export interface DivisionCollaborator {
  id: number;
  division_name: string;
}

export interface Tags {
  tag_id: number;
  name: string;
  created_at: string;
  deleted_at?: string;
}
