<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Fragment } from '@fragments/shared';
import { authApi, fragmentsApi, isTrialMode } from './api';
import type { AuthSession } from '@fragments/shared';
import { displayDate, shiftDate, toDateKey } from './date';
import FragmentComposer from './components/FragmentComposer.vue';
import FragmentEntry from './components/FragmentEntry.vue';
import AuthPanel from './components/AuthPanel.vue';
import { clearEncryption, decryptFragment, encryptFragmentFields, unlockEncryption } from './encryption';
import { locale, setLocale, t, translateError } from './i18n';

const selectedDate = ref(toDateKey(new Date()));
const fragments = ref<Fragment[]>([]);
const loading = ref(false);
const error = ref('');
const session = ref<AuthSession | null>(null);
const activeView = ref<'fragments' | 'help'>('fragments');
const checkingSession = ref(!isTrialMode);
const unlocked = ref(isTrialMode);
const assetBase = import.meta.env.BASE_URL;
async function load() {
  if (!isTrialMode && !session.value) return;
  loading.value = true; error.value = '';
  try {
    const stored = await fragmentsApi.list(selectedDate.value);
    if (!isTrialMode && session.value) {
      const decrypted = [];
      for (const fragment of stored) {
        const value = await decryptFragment(session.value.user.id, fragment);
        decrypted.push({ ...fragment, title: value.title, content: value.content });
        if (value.legacy) await fragmentsApi.update(fragment.id, await encryptFragmentFields(session.value.user.id, value));
      }
      fragments.value = decrypted;
    } else fragments.value = stored;
  }
  catch (caught) { error.value = translateError(caught, 'couldNotLoad'); }
  finally { loading.value = false; }
}
async function save(input: { title: string; content: string }): Promise<boolean> {
  try {
    const encrypted = isTrialMode ? input : await encryptFragmentFields(session.value!.user.id, input);
    await fragmentsApi.create({ title: encrypted.title, content: encrypted.content!, date: selectedDate.value });
    await load();
    return true;
  } catch (caught) {
    error.value = translateError(caught, 'couldNotSave');
    return false;
  }
}
async function transcribe(audio: Blob): Promise<boolean> {
  try { const fragment = await fragmentsApi.transcribe(audio, selectedDate.value); if (!isTrialMode && session.value) await fragmentsApi.update(fragment.id, await encryptFragmentFields(session.value.user.id, fragment)); await load(); return true; }
  catch (caught) { error.value = translateError(caught, 'couldNotTranscribe'); return false; }
}
async function update(id: string, input: { title: string; content: string }) {
  try { await fragmentsApi.update(id, isTrialMode ? input : await encryptFragmentFields(session.value!.user.id, input)); await load(); } catch (caught) { error.value = translateError(caught, 'couldNotUpdate'); }
}
async function remove(id: string) {
  if (!window.confirm(t('deleteConfirm'))) return;
  try { await fragmentsApi.remove(id); await load(); } catch (caught) { error.value = translateError(caught, 'couldNotDelete'); }
}
watch(selectedDate, load);
onMounted(async () => { if (isTrialMode) { await load(); return; } try { session.value = await authApi.session(); } catch { session.value = null; } finally { checkingSession.value = false; } });
async function authenticated(payload: { session: AuthSession; password: string }) { session.value = payload.session; await unlockEncryption(payload.password, payload.session.user.id); unlocked.value = true; await load(); }
async function signOut() { clearEncryption(); await authApi.logout(); session.value = null; fragments.value = []; unlocked.value = false; }
</script>

<template>
  <AuthPanel v-if="!isTrialMode && !checkingSession && (!session || !unlocked)" @authenticated="authenticated" />
  <main v-else class="workspace">
    <header class="topbar">
      <div class="brand"><img class="brand-mark" :src="`${assetBase}icon.svg`" alt="" /><span>Fragments</span></div>
      <div class="account-area"><span>{{ isTrialMode ? t('trialMode') : session?.user.email }}</span><span class="account-divider" aria-hidden="true"></span><button class="text-button" @click="activeView = activeView === 'help' ? 'fragments' : 'help'">{{ activeView === 'help' ? t('backToFragments') : t('help') }}</button><label class="language-picker"><span class="sr-only">{{ t('language') }}</span><select :value="locale" :aria-label="t('language')" @change="setLocale(($event.target as HTMLSelectElement).value as 'en' | 'es')"><option value="en">EN</option><option value="es">ES</option></select></label><span v-if="session" class="account-divider" aria-hidden="true"></span><button v-if="session" class="text-button" @click="signOut">{{ t('signOut') }}</button></div>
    </header>
    <div v-if="activeView === 'help'" class="page help-page">
      <section class="help-heading">
        <p class="eyebrow">{{ t('littleGuidance') }}</p>
        <h1>{{ t('help') }}</h1>
        <p class="help-intro">{{ t('helpIntro') }}</p>
      </section>
      <div class="help-content">
        <section class="help-section">
          <h2>{{ t('whatIsFragments') }}</h2><p>{{ t('fragmentsDescription') }}</p>
        </section>
        <section class="help-section">
          <h2>{{ t('howUse') }}</h2><p>{{ t('howUseDescription') }}</p>
        </section>
        <section class="help-section">
          <h2>{{ t('whatToday') }}</h2>
          <ul>
            <li>{{ t('createText') }}</li><li>{{ t('recordVoice') }}</li><li>{{ t('browseByDay') }}</li><li>{{ t('editOrDelete') }}</li><li>{{ t('keepPrivate') }}</li>
          </ul>
        </section>
        <section class="help-section">
          <h2>{{ t('voiceNotes') }}</h2><p>{{ t('voiceDescription') }}</p><p>{{ t('voicePreview') }}</p>
        </section>
        <section class="help-section">
          <h2>{{ t('notAvailable') }}</h2>
          <ul>
            <li>{{ t('noEmailRecovery') }}</li><li>{{ t('noOrganisation') }}</li><li>{{ t('noSearch') }}</li><li>{{ t('noMobile') }}</li><li>{{ t('noAi') }}</li>
          </ul>
        </section>
        <section class="help-section">
          <h2>{{ t('mayComeNext') }}</h2><p>{{ t('futureDescription') }}</p><p>{{ t('futureExperiments') }}</p>
        </section>
        <section class="help-section">
          <h2>{{ t('privacy') }}</h2><p>{{ t('privacyDescription') }}</p><p>{{ t('privacyWarning') }}</p>
        </section>
        <section class="help-section help-note">
          <h2>{{ t('needToKnow') }}</h2><p>{{ t('needToKnowDescription') }}</p>
        </section>
      </div>
    </div>
    <div v-else class="page">
      <section class="page-heading">
        <p class="eyebrow">{{ t('dailyNotes') }}</p>
        <nav class="day-nav" :aria-label="t('dateNavigation')">
          <button class="day-button" :aria-label="t('previousDay')" @click="selectedDate = shiftDate(selectedDate, -1)">‹</button>
          <div class="day-summary"><h1>{{ selectedDate === toDateKey(new Date()) ? t('today') : displayDate(selectedDate, locale === 'es' ? 'es-ES' : 'en-US') }}</h1><p v-if="selectedDate === toDateKey(new Date())" class="date-label">{{ displayDate(selectedDate, locale === 'es' ? 'es-ES' : 'en-US') }}</p></div>
          <button class="day-button" :aria-label="t('nextDay')" @click="selectedDate = shiftDate(selectedDate, 1)">›</button>
        </nav>
      </section>
      <section class="capture" :aria-label="t('writeFragment')"><FragmentComposer :save-fragment="save" :transcribe-fragment="isTrialMode ? undefined : transcribe" /></section>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <section class="timeline" :aria-label="t('fragmentsForDay')">
      <p v-if="!loading && fragments.length > 0" class="fragment-count">{{ t('fragmentCount', { count: fragments.length, word: fragments.length === 1 ? t('fragmentSingular') : t('fragmentPlural') }) }}</p>
      <p v-if="loading" class="empty">{{ t('openingPage') }}</p>
      <p v-else-if="fragments.length === 0" class="empty">{{ t('nothingYet') }}</p>
      <FragmentEntry v-for="fragment in fragments" :key="fragment.id" :fragment="fragment" @update="update" @remove="remove" />
    </section>
    </div>
  </main>
</template>
