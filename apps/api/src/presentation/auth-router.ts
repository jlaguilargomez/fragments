import { Router } from 'express';
import { z } from 'zod';
import { getSession, InvalidCredentialsError, login, logout, normaliseEmail, signUp } from '@fragments/server-core';
import type { AuthRepository } from '@fragments/server-core';

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(12) });
export const SESSION_COOKIE = 'fragments_session';
const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/' };
function tokenFrom(request: { headers: { cookie?: string } }): string | undefined { const value = request.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1); return value ? decodeURIComponent(value) : undefined; }
export function createAuthRouter(repository: AuthRepository): Router {
  const router = Router();
  router.post('/signup', async (request, response, next) => { try { const result = await signUp(repository, credentialsSchema.parse(request.body)); response.cookie(SESSION_COOKIE, result.token, cookieOptions); response.status(201).json(result.session); } catch (error) { if (isUniqueError(error)) response.status(409).json({ error: 'An account with that email already exists' }); else next(error); } });
  router.post('/login', async (request, response, next) => { try { const result = await login(repository, credentialsSchema.parse(request.body)); response.cookie(SESSION_COOKIE, result.token, cookieOptions); response.json(result.session); } catch (error) { if (error instanceof InvalidCredentialsError) response.status(401).json({ error: error.message }); else next(error); } });
  router.get('/session', async (request, response, next) => { try { const session = await getSession(repository, tokenFrom(request)); response.json(session ?? null); } catch (error) { next(error); } });
  router.post('/logout', async (request, response, next) => { try { await logout(repository, tokenFrom(request)); response.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' }); response.status(204).send(); } catch (error) { next(error); } });
  return router;
}
export async function currentUser(repository: AuthRepository, request: { headers: { cookie?: string } }): Promise<{ id: string }> { const session = await getSession(repository, tokenFrom(request)); if (!session) { const error = new Error('Authentication required'); (error as Error & { status?: number }).status = 401; throw error; } return session.user; }
function isUniqueError(error: unknown): boolean { return typeof error === 'object' && error !== null && 'code' in error && String(error.code).includes('CONSTRAINT'); }
