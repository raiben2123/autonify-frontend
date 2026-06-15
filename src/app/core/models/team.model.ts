export interface TeamResponse {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'LEADER' | 'MEMBER';
  joinedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface AddTeamMemberRequest {
  userId: string;
  role?: 'LEADER' | 'MEMBER';
}
