import { randomUUID } from 'node:crypto';
import type { CreateFragmentInput, UpdateFragmentInput } from '@fragments/shared';
import type { FragmentRepository, StoredFragment } from '../domain/fragment.js';

export class FragmentNotFoundError extends Error {
  constructor() { super('Fragment not found'); }
}

export function createFragment(repository: FragmentRepository, input: CreateFragmentInput): StoredFragment {
  const now = new Date().toISOString();
  return repository.create({
    id: randomUUID(),
    title: normaliseTitle(input.title),
    content: input.content.trim(),
    source: 'text',
    createdAt: now,
    updatedAt: now
  });
}

export function getFragmentsForDate(repository: FragmentRepository, date: string): StoredFragment[] {
  return repository.findByDate(date);
}

export function getFragment(repository: FragmentRepository, id: string): StoredFragment {
  const fragment = repository.findById(id);
  if (!fragment) throw new FragmentNotFoundError();
  return fragment;
}

export function updateFragment(repository: FragmentRepository, id: string, input: UpdateFragmentInput): StoredFragment {
  const existing = getFragment(repository, id);
  const updated = repository.update({
    ...existing,
    title: input.title === undefined ? existing.title : normaliseTitle(input.title),
    content: input.content === undefined ? existing.content : input.content.trim(),
    updatedAt: new Date().toISOString()
  });
  if (!updated) throw new FragmentNotFoundError();
  return updated;
}

export function deleteFragment(repository: FragmentRepository, id: string): void {
  if (!repository.delete(id)) throw new FragmentNotFoundError();
}

function normaliseTitle(title: string | null | undefined): string | null {
  const trimmed = title?.trim();
  return trimmed ? trimmed : null;
}
