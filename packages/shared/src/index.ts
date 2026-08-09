export interface Fragment {
  id: string;
  title: string | null;
  content: string;
  source: 'text';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFragmentInput {
  title?: string | null;
  content: string;
}

export interface UpdateFragmentInput {
  title?: string | null;
  content?: string;
}
