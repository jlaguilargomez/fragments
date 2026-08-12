<script setup lang="ts">
import { ref } from 'vue';
import { authApi } from '../api';
import type { AuthSession } from '@fragments/shared';
const assetBase = import.meta.env.BASE_URL;
const emit = defineEmits<{ authenticated: [payload: { session: AuthSession; password: string }] }>();
const mode = ref<'login' | 'signup'>('login'); const email = ref(''); const password = ref(''); const error = ref(''); const busy = ref(false);
async function submit() { error.value = ''; busy.value = true; try { const credentials = { email: email.value, password: password.value }; const session = mode.value === 'login' ? await authApi.login(credentials) : await authApi.signup(credentials); emit('authenticated', { session, password: credentials.password }); } catch (caught) { error.value = caught instanceof Error ? caught.message : 'Could not authenticate.'; } finally { busy.value = false; } }
</script>
<template>
  <main class="auth-page"><div class="auth-card"><div class="brand auth-brand"><img class="brand-mark" :src="`${assetBase}icon.svg`" alt="" /><span>Fragments</span></div><p class="eyebrow">Private notebook</p><h1>{{ mode === 'login' ? 'Welcome back' : 'Make a private space' }}</h1><p class="auth-intro">{{ mode === 'login' ? 'Continue with your thoughts.' : 'Start capturing thoughts without organising them first.' }}</p><form @submit.prevent="submit"><label>Email<input v-model="email" type="email" autocomplete="email" required /></label><label>Password<input v-model="password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" minlength="12" required /><small v-if="mode === 'signup'">At least 12 characters.</small></label><p v-if="error" class="error" role="alert">{{ error }}</p><button class="save-button auth-submit" :disabled="busy">{{ busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account' }}</button></form><button class="text-button auth-switch" @click="mode = mode === 'login' ? 'signup' : 'login'; error = ''">{{ mode === 'login' ? 'Create a new account' : 'I already have an account' }}</button></div></main>
</template>
