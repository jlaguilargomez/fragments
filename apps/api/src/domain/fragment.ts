export interface StoredFragment {
  id: string;
  title: string | null;
  content: string;
  source: 'text';
  createdAt: string;
  updatedAt: string;
}

export interface FragmentRepository {
  create(fragment: StoredFragment): StoredFragment;
  findById(id: string): StoredFragment | undefined;
  findByDate(date: string): StoredFragment[];
  update(fragment: StoredFragment): StoredFragment | undefined;
  delete(id: string): boolean;
}
