import type { CreateFragmentInput, Fragment, UpdateFragmentInput } from '@fragments/shared';

export interface StoredFragment extends Fragment {}

export interface FragmentRepository {
  create(fragment: StoredFragment): Promise<StoredFragment>;
  findById(id: string): Promise<StoredFragment | undefined>;
  findByDate(date: string): Promise<StoredFragment[]>;
  update(fragment: StoredFragment): Promise<StoredFragment | undefined>;
  delete(id: string): Promise<boolean>;
}

export class FragmentNotFoundError extends Error {
  constructor() { super('Fragment not found'); }
}

export function createFragment(repository: FragmentRepository, input: CreateFragmentInput): Promise<StoredFragment> {
  const now = new Date().toISOString();
  return repository.create({
    id: crypto.randomUUID(),
    title: normaliseTitle(input.title),
    content: input.content.trim(),
    source: 'text',
    createdAt: now,
    updatedAt: now
  });
}

export function getFragmentsForDate(repository: FragmentRepository, date: string): Promise<StoredFragment[]> {
  return repository.findByDate(date);
}

export async function getFragment(repository: FragmentRepository, id: string): Promise<StoredFragment> {
  const fragment = await repository.findById(id);
  if (!fragment) throw new FragmentNotFoundError();
  return fragment;
}

export async function updateFragment(repository: FragmentRepository, id: string, input: UpdateFragmentInput): Promise<StoredFragment> {
  const existing = await getFragment(repository, id);
  const updated = await repository.update({
    ...existing,
    title: input.title === undefined ? existing.title : normaliseTitle(input.title),
    content: input.content === undefined ? existing.content : input.content.trim(),
    updatedAt: new Date().toISOString()
  });
  if (!updated) throw new FragmentNotFoundError();
  return updated;
}

export async function deleteFragment(repository: FragmentRepository, id: string): Promise<void> {
  if (!await repository.delete(id)) throw new FragmentNotFoundError();
}

function normaliseTitle(title: string | null | undefined): string | null {
  const trimmed = title?.trim();
  return trimmed ? trimmed : null;
}
