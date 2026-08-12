<script setup lang="ts">
import { ref } from 'vue';
import { authApi } from '../api';
import type { AuthSession } from '@fragments/shared';
import { locale, setLocale, t, translateError } from '../i18n';
const assetBase = import.meta.env.BASE_URL;
const emit = defineEmits<{ authenticated: [payload: { session: AuthSession; password: string }] }>();
const mode = ref<'login' | 'signup'>('login'); const email = ref(''); const password = ref(''); const error = ref(''); const busy = ref(false);
async function submit() { error.value = ''; busy.value = true; try { const credentials = { email: email.value, password: password.value }; const session = mode.value === 'login' ? await authApi.login(credentials) : await authApi.signup(credentials); emit('authenticated', { session, password: credentials.password }); } catch (caught) { error.value = translateError(caught, 'couldNotAuthenticate'); } finally { busy.value = false; } }
</script>
<template>
  <main class="auth-page"><div class="auth-card"><div class="auth-language"><label class="language-picker"><span class="sr-only">{{ t('language') }}</span><select :value="locale" :aria-label="t('language')" @change="setLocale(($event.target as HTMLSelectElement).value as 'en' | 'es')"><option value="en">{{ t('english') }}</option><option value="es">{{ t('spanish') }}</option></select></label></div><div class="brand auth-brand"><img class="brand-mark" :src="`${assetBase}icon.svg`" alt="" /><span>Fragments</span></div><p class="eyebrow">{{ t('privateNotebook') }}</p><h1>{{ mode === 'login' ? t('welcomeBack') : t('makePrivateSpace') }}</h1><p class="auth-intro">{{ mode === 'login' ? t('continueThoughts') : t('startCapturing') }}</p><form @submit.prevent="submit"><label>{{ t('email') }}<input v-model="email" type="email" autocomplete="email" required /></label><label>{{ t('password') }}<input v-model="password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" minlength="12" required /><small v-if="mode === 'signup'">{{ t('passwordHint') }}</small></label><p v-if="error" class="error" role="alert">{{ error }}</p><button class="save-button auth-submit" :disabled="busy">{{ busy ? t('working') : mode === 'login' ? t('signIn') : t('createAccount') }}</button></form><button class="text-button auth-switch" @click="mode = mode === 'login' ? 'signup' : 'login'; error = ''">{{ mode === 'login' ? t('createNewAccount') : t('alreadyHaveAccount') }}</button></div></main>
</template>
