
export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  content: string;
}

export type UserProfile = 'student' | 'professional' | 'none';
