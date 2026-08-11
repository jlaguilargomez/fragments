export interface Fragment {
  id: string;
  userId?: string;
  title: string | null;
  content: string;
  source: 'text';
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser { id: string; email: string; }
export interface AuthSession { user: AuthUser; expiresAt: string; }
export interface AuthCredentials { email: string; password: string; }

export interface CreateFragmentInput {
  title?: string | null;
  content: string;
}

export interface UpdateFragmentInput {
  title?: string | null;
  content?: string;
}
