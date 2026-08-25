<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Fragment } from '@fragments/shared';
import { authApi, fragmentsApi, isTrialMode } from './api';
import type { AuthSession } from '@fragments/shared';
import { displayCompactDate, displayDate, displayDayHeading, shiftDate, toDateKey } from './date';
import FragmentComposer from './components/FragmentComposer.vue';
import FragmentEntry from './components/FragmentEntry.vue';
import AuthPanel from './components/AuthPanel.vue';
import ContextsView from './components/ContextsView.vue';
import { clearEncryption, decryptFragment, encryptFragmentFields, unlockEncryption } from './encryption';
import { locale, t, translateError } from './i18n';

const selectedDate = ref(toDateKey(new Date()));
const fragments = ref<Fragment[]>([]);
const loading = ref(false);
const error = ref('');
const session = ref<AuthSession | null>(null);
const activeView = ref<'fragments' | 'contexts' | 'help'>('fragments');
const allFragments = ref<Fragment[]>([]);
const contextsLoading = ref(false);
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
        decrypted.push({ ...fragment, title: value.title, content: value.content, contexts: value.contexts });
        if (value.legacy) await fragmentsApi.update(fragment.id, await encryptFragmentFields(session.value.user.id, value));
      }
      fragments.value = decrypted;
    } else fragments.value = stored.map(fragment => ({ ...fragment, contexts: fragment.contexts ?? [] }));
  }
  catch (caught) { error.value = translateError(caught, 'couldNotLoad'); }
  finally { loading.value = false; }
}
async function loadAll() {
  if (!isTrialMode && !session.value) return;
  contextsLoading.value = true; error.value = '';
  try {
    const stored = await fragmentsApi.listAll(); const decrypted: Fragment[] = [];
    for (const fragment of stored) {
      if (!isTrialMode && session.value) {
        const value = await decryptFragment(session.value.user.id, fragment);
        decrypted.push({ ...fragment, title: value.title, content: value.content, contexts: value.contexts });
        if (value.legacy) await fragmentsApi.update(fragment.id, await encryptFragmentFields(session.value.user.id, value));
      } else decrypted.push({ ...fragment, contexts: fragment.contexts ?? [] });
    }
    allFragments.value = decrypted;
  } catch (caught) { error.value = translateError(caught, 'couldNotLoad'); }
  finally { contextsLoading.value = false; }
}
async function save(input: { title: string; content: string; contexts: string[] }): Promise<boolean> {
  try {
    const encrypted = isTrialMode ? input : await encryptFragmentFields(session.value!.user.id, input);
    await fragmentsApi.create({ title: encrypted.title, content: encrypted.content!, contexts: encrypted.contexts!, date: selectedDate.value });
    await Promise.all([load(), loadAll()]);
    return true;
  } catch (caught) {
    error.value = translateError(caught, 'couldNotSave');
    return false;
  }
}
async function transcribe(audio: Blob): Promise<boolean> {
  try { const fragment = await fragmentsApi.transcribe(audio, selectedDate.value); if (!isTrialMode && session.value) await fragmentsApi.update(fragment.id, await encryptFragmentFields(session.value.user.id, fragment)); await Promise.all([load(), loadAll()]); return true; }
  catch (caught) { error.value = translateError(caught, 'couldNotTranscribe'); return false; }
}
async function persistUpdate(id: string, input: { title: string; content: string; contexts: string[] }) {
  await fragmentsApi.update(id, isTrialMode ? input : await encryptFragmentFields(session.value!.user.id, input));
}
async function update(id: string, input: { title: string; content: string; contexts: string[] }) {
  try { await persistUpdate(id, input); await Promise.all([load(), loadAll()]); } catch (caught) { error.value = translateError(caught, 'couldNotUpdate'); }
}
async function remove(id: string) {
  if (!window.confirm(t('deleteConfirm'))) return;
  try { await fragmentsApi.remove(id); await Promise.all([load(), loadAll()]); } catch (caught) { error.value = translateError(caught, 'couldNotDelete'); }
}
async function renameContext(from: string, to: string) {
  const clean = to.trim().replace(/\s+/g, ' '); if (!clean) return;
  try { const targets = allFragments.value.filter(item => item.contexts.some(context => context.toLocaleLowerCase() === from.toLocaleLowerCase())); await Promise.all(targets.map(fragment => { const values = [...fragment.contexts.filter(context => context.toLocaleLowerCase() !== from.toLocaleLowerCase()), clean]; const contexts = [...new Map(values.map(context => [context.toLocaleLowerCase(), context])).values()]; return persistUpdate(fragment.id, { title: fragment.title ?? '', content: fragment.content, contexts }); })); await Promise.all([loadAll(), load()]); } catch (caught) { error.value = translateError(caught, 'couldNotUpdate'); }
}
async function deleteContext(context: string) {
  try { const targets = allFragments.value.filter(item => item.contexts.some(value => value.toLocaleLowerCase() === context.toLocaleLowerCase())); await Promise.all(targets.map(fragment => persistUpdate(fragment.id, { title: fragment.title ?? '', content: fragment.content, contexts: fragment.contexts.filter(value => value.toLocaleLowerCase() !== context.toLocaleLowerCase()) }))); await Promise.all([loadAll(), load()]); } catch (caught) { error.value = translateError(caught, 'couldNotUpdate'); }
}
async function openContexts() { activeView.value = 'contexts'; await loadAll(); }
watch(selectedDate, load);
onMounted(async () => { if (isTrialMode) { await load(); await loadAll(); return; } try { session.value = await authApi.session(); } catch { session.value = null; } finally { checkingSession.value = false; } });
async function authenticated(payload: { session: AuthSession; password: string }) { session.value = payload.session; await unlockEncryption(payload.password, payload.session.user.id); unlocked.value = true; await load(); await loadAll(); }
async function signOut() { clearEncryption(); await authApi.logout(); session.value = null; fragments.value = []; unlocked.value = false; }
</script>

<template>
  <AuthPanel v-if="!isTrialMode && !checkingSession && (!session || !unlocked)" :session="session" @authenticated="authenticated" />
  <main v-else-if="!checkingSession" class="workspace">
    <header class="topbar">
      <div class="brand"><img class="brand-mark" :src="`${assetBase}icon.svg`" alt="" /><span>Fragments</span></div>
      <div class="account-area"><span>{{ isTrialMode ? t('trialMode') : session?.user.email }}</span><span class="account-divider" aria-hidden="true"></span><button class="text-button help-button" @click="activeView = activeView === 'help' ? 'fragments' : 'help'"><span class="desktop-action-label">{{ activeView === 'help' ? t('backToFragments') : t('help') }}</span><span class="mobile-action-label" aria-hidden="true">?</span></button><button class="text-button contexts-button" :aria-label="activeView === 'contexts' ? t('backToFragments') : t('contexts')" @click="activeView === 'contexts' ? activeView = 'fragments' : openContexts()"><span class="desktop-action-label">{{ activeView === 'contexts' ? t('backToFragments') : t('contexts') }}</span><span class="mobile-action-label" aria-hidden="true">{{ activeView === 'contexts' ? '←' : '#' }}</span></button><span v-if="session" class="account-divider" aria-hidden="true"></span><button v-if="session" class="text-button" @click="signOut">{{ t('signOut') }}</button></div>
    </header>
    <div v-if="activeView === 'help'" class="page help-page">
      <section class="help-heading">
        <p class="eyebrow">{{ t('littleGuidance') }}</p>
        <h1>{{ t('help') }}</h1>
        <p class="help-intro">{{ t('helpIntro') }}</p>
      </section>
      <div class="help-content">
        <section v-if="isTrialMode" class="help-section help-note">
          <h2>{{ t('demoTitle') }}</h2><p>{{ t('demoDescription') }}</p>
          <ul><li>{{ t('demoStorage') }}</li><li>{{ t('demoNoLogin') }}</li><li>{{ t('demoNoVoice') }}</li><li>{{ t('demoNoSync') }}</li><li>{{ t('demoReset') }}</li></ul>
        </section>
        <section v-else class="help-section help-note">
          <h2>{{ t('premiumTitle') }}</h2><p>{{ t('premiumDescription') }}</p>
          <ul><li>{{ t('premiumStorage') }}</li><li>{{ t('premiumLogin') }}</li><li>{{ t('premiumVoice') }}</li><li>{{ t('premiumInvite') }}</li></ul>
        </section>
        <section class="help-section">
          <h2>{{ t('whatIsFragments') }}</h2><p>{{ t('fragmentsDescription') }}</p>
        </section>
        <section class="help-section">
          <h2>{{ t('howUse') }}</h2><p>{{ t('howUseCurrent') }}</p>
        </section>
        <section class="help-section">
          <h2>{{ t('whatToday') }}</h2>
          <ul>
            <li>{{ t('createText') }}</li><li v-if="!isTrialMode">{{ t('recordVoice') }}</li><li>{{ t('browseByDay') }}</li><li>{{ t('browseContexts') }}</li><li>{{ t('editOrDelete') }}</li><li>{{ isTrialMode ? t('demoLocalOnly') : t('keepPrivate') }}</li>
          </ul>
        </section>
        <section v-if="!isTrialMode" class="help-section">
          <h2>{{ t('voiceNotes') }}</h2><p>{{ t('voiceDescription') }}</p><p>{{ t('voicePreview') }}</p>
        </section>
        <section v-else class="help-section">
          <h2>{{ t('voiceNotes') }}</h2><p>{{ t('demoNoVoice') }}</p>
        </section>
        <section class="help-section">
          <h2>{{ t('notAvailable') }}</h2>
          <ul>
            <li>{{ t('noEmailRecovery') }}</li><li>{{ t('noOrganisationCurrent') }}</li><li>{{ t('noSearchCurrent') }}</li><li>{{ t('noMobile') }}</li><li>{{ t('noAi') }}</li>
          </ul>
        </section>
        <section class="help-section">
          <h2>{{ t('mayComeNext') }}</h2><p>{{ t('futureDescriptionCurrent') }}</p><p>{{ t('futureExperiments') }}</p>
        </section>
        <section class="help-section">
          <h2>{{ t('privacy') }}</h2><p>{{ t('privacyDescriptionCurrent') }}</p><p>{{ t('privacyWarningCurrent') }}</p>
        </section>
        <section class="help-section help-note">
          <h2>{{ t('needToKnow') }}</h2><p>{{ t('needToKnowDescription') }}</p>
        </section>
      </div>
    </div>
    <ContextsView v-else-if="activeView === 'contexts'" :fragments="allFragments" :loading="contextsLoading" :error="error" @update="update" @remove="remove" @rename="renameContext" @delete-context="deleteContext" />
    <div v-else class="page">
      <section class="page-heading">
        <p class="eyebrow">{{ t('dailyNotes') }}</p>
        <nav class="day-nav" :aria-label="t('dateNavigation')">
          <button class="day-button" :aria-label="t('previousDay')" @click="selectedDate = shiftDate(selectedDate, -1)">‹</button>
          <div class="day-summary"><h1 :title="displayDate(selectedDate, locale === 'es' ? 'es-ES' : 'en-US')">{{ selectedDate === toDateKey(new Date()) ? t('today') : displayDayHeading(selectedDate, locale === 'es' ? 'es-ES' : 'en-US') }}</h1><p v-if="selectedDate === toDateKey(new Date())" class="date-label">{{ displayCompactDate(selectedDate, locale === 'es' ? 'es-ES' : 'en-US') }}</p><button v-if="selectedDate !== toDateKey(new Date())" class="back-to-today" :aria-label="t('backToToday')" @click="selectedDate = toDateKey(new Date())"><span aria-hidden="true">↶</span>{{ t('backToToday') }}</button></div>
          <button class="day-button" :aria-label="t('nextDay')" @click="selectedDate = shiftDate(selectedDate, 1)">›</button>
        </nav>
      </section>
      <section class="capture" :aria-label="t('writeFragment')"><FragmentComposer :save-fragment="save" :available-contexts="[...new Set(allFragments.flatMap(fragment => fragment.contexts))]" :transcribe-fragment="isTrialMode ? undefined : transcribe" /></section>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <section class="timeline" :aria-label="t('fragmentsForDay')">
      <p v-if="!loading && fragments.length > 0" class="fragment-count">{{ t('fragmentCount', { count: fragments.length, word: fragments.length === 1 ? t('fragmentSingular') : t('fragmentPlural') }) }}</p>
      <p v-if="loading" class="empty">{{ t('openingPage') }}</p>
      <p v-else-if="fragments.length === 0" class="empty">{{ t('nothingYet') }}</p>
      <FragmentEntry v-for="fragment in fragments" :key="fragment.id" :fragment="fragment" :available-contexts="[...new Set(allFragments.flatMap(item => item.contexts))]" @update="update" @remove="remove" />
    </section>
    </div>
  </main>
</template>
