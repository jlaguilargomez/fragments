const FORMAT = 'f1';
const ALGORITHM = 'AES-GCM';
const ITERATIONS = 250_000;
let activeUserId = '';
let activeKey: CryptoKey | undefined;

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function bytes(value: string): Uint8Array { return Uint8Array.from(atob(value), character => character.charCodeAt(0)); }

async function derive(password: string, userId: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode(`fragments:${FORMAT}:${userId}`), iterations: ITERATIONS, hash: 'SHA-256' },
    material, { name: ALGORITHM, length: 256 }, false, ['encrypt', 'decrypt']
  );
}

export async function unlockEncryption(password: string, userId: string): Promise<void> {
  activeKey = await derive(password, userId);
  activeUserId = userId;
}
export function clearEncryption(): void { activeKey = undefined; activeUserId = ''; }
function keyFor(userId: string): CryptoKey {
  if (!activeKey || activeUserId !== userId) throw new Error('Unlock your notes to continue.');
  return activeKey;
}

export async function encryptValue(value: string, userId: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv: iv as unknown as BufferSource }, keyFor(userId), new TextEncoder().encode(value));
  return `${FORMAT}:${base64(iv)}:${base64(new Uint8Array(encrypted))}`;
}
export async function decryptValue(value: string, userId: string): Promise<string> {
  if (!value.startsWith(`${FORMAT}:`)) return value;
  const [, iv, encrypted] = value.split(':');
  const plain = await crypto.subtle.decrypt({ name: ALGORITHM, iv: bytes(iv) as unknown as BufferSource }, keyFor(userId), bytes(encrypted) as unknown as BufferSource);
  return new TextDecoder().decode(plain);
}
export async function encryptFragmentFields(userId: string, input: { title?: string | null; content?: string }): Promise<{ title?: string | null; content?: string }> {
  const result: { title?: string | null; content?: string } = {};
  if (input.title !== undefined) result.title = input.title === null ? null : await encryptValue(input.title, userId);
  if (input.content !== undefined) result.content = await encryptValue(input.content, userId);
  return result;
}
export async function decryptFragment(userId: string, fragment: { title: string | null; content: string }): Promise<{ title: string | null; content: string; legacy: boolean }> {
  const titleEncrypted = fragment.title === null || fragment.title.startsWith(`${FORMAT}:`);
  const contentEncrypted = fragment.content.startsWith(`${FORMAT}:`);
  return {
    title: fragment.title === null ? null : await decryptValue(fragment.title, userId),
    content: await decryptValue(fragment.content, userId),
    legacy: !titleEncrypted || !contentEncrypted
  };
}
