import type { AuthCredentials, AuthSession, AuthUser, CreateFragmentInput, Fragment, UpdateFragmentInput } from '@fragments/shared';

export interface StoredFragment extends Fragment {}

export interface StoredUser extends AuthUser { passwordHash: string; createdAt: string; updatedAt: string; }
export interface StoredSession { id: string; userId: string; tokenHash: string; expiresAt: string; revokedAt: string | null; createdAt: string; }

export interface AuthRepository {
  findUserByEmail(email: string): Promise<StoredUser | undefined>;
  findUserById(id: string): Promise<StoredUser | undefined>;
  createUser(user: StoredUser): Promise<StoredUser>;
  createSession(session: StoredSession): Promise<StoredSession>;
  findSessionByTokenHash(tokenHash: string): Promise<StoredSession | undefined>;
  revokeSession(id: string, revokedAt: string): Promise<void>;
}

export interface FragmentRepository {
  create(fragment: StoredFragment): Promise<StoredFragment>;
  findById(userId: string, id: string): Promise<StoredFragment | undefined>;
  findByDate(userId: string, date: string): Promise<StoredFragment[]>;
  update(userId: string, fragment: StoredFragment): Promise<StoredFragment | undefined>;
  delete(userId: string, id: string): Promise<boolean>;
}

export class FragmentNotFoundError extends Error {
  constructor() { super('Fragment not found'); }
}

export function createFragment(repository: FragmentRepository, userId: string, input: CreateFragmentInput): Promise<StoredFragment> {
  const now = new Date().toISOString();
  const createdAt = `${input.date}T${now.slice(11)}`;
  return repository.create({
    id: crypto.randomUUID(), userId,
    title: normaliseTitle(input.title),
    content: input.content.trim(),
    source: 'text',
    createdAt,
    updatedAt: now
  });
}

export function getFragmentsForDate(repository: FragmentRepository, userId: string, date: string): Promise<StoredFragment[]> {
  return repository.findByDate(userId, date);
}

export async function getFragment(repository: FragmentRepository, userId: string, id: string): Promise<StoredFragment> {
  const fragment = await repository.findById(userId, id);
  if (!fragment) throw new FragmentNotFoundError();
  return fragment;
}

export async function updateFragment(repository: FragmentRepository, userId: string, id: string, input: UpdateFragmentInput): Promise<StoredFragment> {
  const existing = await getFragment(repository, userId, id);
  const updated = await repository.update(userId, {
    ...existing,
    title: input.title === undefined ? existing.title : normaliseTitle(input.title),
    content: input.content === undefined ? existing.content : input.content.trim(),
    updatedAt: new Date().toISOString()
  });
  if (!updated) throw new FragmentNotFoundError();
  return updated;
}

export async function deleteFragment(repository: FragmentRepository, userId: string, id: string): Promise<void> {
  if (!await repository.delete(userId, id)) throw new FragmentNotFoundError();
}

function normaliseTitle(title: string | null | undefined): string | null {
  const trimmed = title?.trim();
  return trimmed ? trimmed : null;
}

const SESSION_DAYS = 30;
// Cloudflare Workers currently rejects PBKDF2 iteration counts above 100,000.
// Keep the value shared by Node and Workers so password hashes verify in both runtimes.
const PBKDF2_ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array): string { return btoa(String.fromCharCode(...bytes)); }
function base64ToBytes(value: string): Uint8Array { return Uint8Array.from(atob(value), character => character.charCodeAt(0)); }
function randomToken(bytes = 32): string { const value = new Uint8Array(bytes); crypto.getRandomValues(value); return bytesToBase64(value); }

export function normaliseEmail(email: string): string { return email.trim().toLowerCase(); }

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16); crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, iterationText, saltText, expectedText] = encoded.split('$');
  if (algorithm !== 'pbkdf2-sha256' || !iterationText || !saltText || !expectedText) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: base64ToBytes(saltText).buffer as ArrayBuffer, iterations: Number(iterationText), hash: 'SHA-256' }, key, 256);
  const actual = new Uint8Array(bits); const expected = base64ToBytes(expectedText);
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

export async function digestToken(token: string): Promise<string> {
  return bytesToBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))));
}

export async function signUp(repository: AuthRepository, credentials: AuthCredentials): Promise<{ session: AuthSession; token: string }> {
  const email = normaliseEmail(credentials.email);
  const now = new Date().toISOString();
  const user: StoredUser = { id: crypto.randomUUID(), email, passwordHash: await hashPassword(credentials.password), createdAt: now, updatedAt: now };
  await repository.createUser(user);
  return createSession(repository, user);
}

export async function login(repository: AuthRepository, credentials: AuthCredentials): Promise<{ session: AuthSession; token: string }> {
  const user = await repository.findUserByEmail(normaliseEmail(credentials.email));
  if (!user || !await verifyPassword(credentials.password, user.passwordHash)) throw new InvalidCredentialsError();
  return createSession(repository, user);
}

async function createSession(repository: AuthRepository, user: StoredUser): Promise<{ session: AuthSession; token: string }> {
  const token = randomToken(); const now = new Date(); const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000).toISOString();
  await repository.createSession({ id: crypto.randomUUID(), userId: user.id, tokenHash: await digestToken(token), expiresAt: expires, revokedAt: null, createdAt: now.toISOString() });
  return { session: { user: { id: user.id, email: user.email }, expiresAt: expires }, token };
}

export async function getSession(repository: AuthRepository, token: string | undefined): Promise<AuthSession | undefined> {
  if (!token) return undefined;
  const stored = await repository.findSessionByTokenHash(await digestToken(token));
  if (!stored || stored.revokedAt || Date.parse(stored.expiresAt) <= Date.now()) return undefined;
  const user = await repository.findUserById(stored.userId);
  return user ? { user: { id: user.id, email: user.email }, expiresAt: stored.expiresAt } : undefined;
}

export async function logout(repository: AuthRepository, token: string | undefined): Promise<void> {
  if (!token) return;
  const session = await repository.findSessionByTokenHash(await digestToken(token));
  if (session) await repository.revokeSession(session.id, new Date().toISOString());
}

export class InvalidCredentialsError extends Error { constructor() { super('Invalid email or password'); } }
