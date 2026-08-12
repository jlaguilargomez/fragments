<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Fragment } from '@fragments/shared';
import { authApi, fragmentsApi, isVisualDemo } from './api';
import type { AuthSession } from '@fragments/shared';
import { displayDate, shiftDate, toDateKey } from './date';
import FragmentComposer from './components/FragmentComposer.vue';
import FragmentEntry from './components/FragmentEntry.vue';
import AuthPanel from './components/AuthPanel.vue';
import { clearEncryption, decryptFragment, encryptFragmentFields, unlockEncryption } from './encryption';

const selectedDate = ref(toDateKey(new Date()));
const fragments = ref<Fragment[]>([]);
const loading = ref(false);
const error = ref('');
const session = ref<AuthSession | null>(null);
const activeView = ref<'fragments' | 'help'>('fragments');
const checkingSession = ref(!isVisualDemo);
const unlocked = ref(isVisualDemo);
const assetBase = import.meta.env.BASE_URL;
async function load() {
  if (!isVisualDemo && !session.value) return;
  loading.value = true; error.value = '';
  try {
    const stored = await fragmentsApi.list(selectedDate.value);
    if (!isVisualDemo && session.value) {
      const decrypted = [];
      for (const fragment of stored) {
        const value = await decryptFragment(session.value.user.id, fragment);
        decrypted.push({ ...fragment, title: value.title, content: value.content });
        if (value.legacy) await fragmentsApi.update(fragment.id, await encryptFragmentFields(session.value.user.id, value));
      }
      fragments.value = decrypted;
    } else fragments.value = stored;
  }
  catch (caught) { error.value = caught instanceof Error ? caught.message : 'Could not load your fragments.'; }
  finally { loading.value = false; }
}
async function save(input: { title: string; content: string }): Promise<boolean> {
  try {
    const encrypted = isVisualDemo ? input : await encryptFragmentFields(session.value!.user.id, input);
    await fragmentsApi.create({ title: encrypted.title, content: encrypted.content!, date: selectedDate.value });
    await load();
    return true;
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not save your fragment.';
    return false;
  }
}
async function transcribe(audio: Blob): Promise<boolean> {
  try { const fragment = await fragmentsApi.transcribe(audio, selectedDate.value); if (!isVisualDemo && session.value) await fragmentsApi.update(fragment.id, await encryptFragmentFields(session.value.user.id, fragment)); await load(); return true; }
  catch (caught) { error.value = caught instanceof Error ? caught.message : 'Could not transcribe your recording.'; return false; }
}
async function update(id: string, input: { title: string; content: string }) {
  try { await fragmentsApi.update(id, isVisualDemo ? input : await encryptFragmentFields(session.value!.user.id, input)); await load(); } catch (caught) { error.value = caught instanceof Error ? caught.message : 'Could not update your fragment.'; }
}
async function remove(id: string) {
  if (!window.confirm('Delete this fragment?')) return;
  try { await fragmentsApi.remove(id); await load(); } catch (caught) { error.value = caught instanceof Error ? caught.message : 'Could not delete your fragment.'; }
}
watch(selectedDate, load);
onMounted(async () => { if (isVisualDemo) { await load(); return; } try { session.value = await authApi.session(); } catch { session.value = null; } finally { checkingSession.value = false; } });
async function authenticated(payload: { session: AuthSession; password: string }) { session.value = payload.session; await unlockEncryption(payload.password, payload.session.user.id); unlocked.value = true; await load(); }
async function signOut() { clearEncryption(); await authApi.logout(); session.value = null; fragments.value = []; unlocked.value = false; }
</script>

<template>
  <AuthPanel v-if="!isVisualDemo && !checkingSession && (!session || !unlocked)" @authenticated="authenticated" />
  <main v-else class="workspace">
    <header class="topbar">
      <div class="brand"><img class="brand-mark" :src="`${assetBase}icon.svg`" alt="" /><span>Fragments</span></div>
      <div class="account-area"><span>{{ isVisualDemo ? 'Visual demo · changes are temporary' : session?.user.email }}</span><span class="account-divider" aria-hidden="true"></span><button class="text-button" @click="activeView = activeView === 'help' ? 'fragments' : 'help'">{{ activeView === 'help' ? 'Back to fragments' : 'Help' }}</button><span v-if="session" class="account-divider" aria-hidden="true"></span><button v-if="session" class="text-button" @click="signOut">Sign out</button></div>
    </header>
    <div v-if="activeView === 'help'" class="page help-page">
      <section class="help-heading">
        <p class="eyebrow">A little guidance</p>
        <h1>Help</h1>
        <p class="help-intro">Fragments is a calm place to capture thoughts before deciding what they need to become.</p>
      </section>
      <div class="help-content">
        <section class="help-section">
          <h2>What is Fragments?</h2>
          <p>Fragments is a calm, private notebook for capturing thoughts before organising them. A fragment can be an idea, memory, task, reflection, observation, quote, or anything you want to keep for later.</p>
        </section>
        <section class="help-section">
          <h2>How should I use it?</h2>
          <p>Write first, organise later. Choose a day, add an optional title, write what is on your mind, and save it. You can return to previous or future days using the arrows. Your fragments can be edited or deleted at any time.</p>
        </section>
        <section class="help-section">
          <h2>What can I do today?</h2>
          <ul>
            <li>Create text fragments with an optional title.</li>
            <li>Record a short voice note and have it transcribed into a fragment.</li>
            <li>Browse fragments by day.</li>
            <li>Edit or delete your fragments.</li>
            <li>Keep fragments private to your account.</li>
          </ul>
        </section>
        <section class="help-section">
          <h2>Voice notes</h2>
          <p>Voice capture works in supported browsers and requires microphone permission. Recordings can be up to five minutes long. The audio is sent for transcription and then discarded; the resulting text is saved as a voice fragment.</p>
          <p>Voice transcription is available in the deployed preview, while local development currently focuses on the text workflow.</p>
        </section>
        <section class="help-section">
          <h2>What is not available yet?</h2>
          <ul>
            <li>Email verification or password recovery.</li>
            <li>Tags, folders, contexts, or other ways to organise fragments.</li>
            <li>Search, semantic search, exports, sharing, or synchronisation.</li>
            <li>Mobile applications or notifications.</li>
            <li>AI writing assistance beyond the current voice transcription.</li>
          </ul>
        </section>
        <section class="help-section">
          <h2>What may come next?</h2>
          <p>The proposed direction is optional AI enrichment that preserves your voice, followed by lightweight contexts such as Work, Books, or Personal.</p>
          <p>Later experiments may explore search, links, and ways to turn fragments into longer pieces of writing. These are ideas, not scheduled promises.</p>
        </section>
        <section class="help-section">
          <h2>Privacy and limitations</h2>
          <p>Fragments belong to the signed-in account that created them. This is an early technical preview, so it should not yet be treated as a finished production service. Please use test content while the project continues to evolve.</p>
        </section>
        <section class="help-section help-note">
          <h2>Need to know</h2>
          <p>The app is designed for quick capture, not perfect organisation. A fragment does not need to be complete, useful, or well written. It only needs to be worth keeping.</p>
        </section>
      </div>
    </div>
    <div v-else class="page">
      <section class="page-heading">
        <p class="eyebrow">Daily notes</p>
        <nav class="day-nav" aria-label="Date navigation">
          <button class="day-button" aria-label="Previous day" @click="selectedDate = shiftDate(selectedDate, -1)">‹</button>
          <div class="day-summary"><h1>{{ selectedDate === toDateKey(new Date()) ? 'Today' : displayDate(selectedDate) }}</h1><p v-if="selectedDate === toDateKey(new Date())" class="date-label">{{ displayDate(selectedDate) }}</p></div>
          <button class="day-button" aria-label="Next day" @click="selectedDate = shiftDate(selectedDate, 1)">›</button>
        </nav>
      </section>
      <section class="capture" aria-label="Write a fragment"><FragmentComposer :save-fragment="save" :transcribe-fragment="transcribe" /></section>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <section class="timeline" aria-label="Fragments for this day">
      <p v-if="!loading && fragments.length > 0" class="fragment-count">{{ fragments.length }} {{ fragments.length === 1 ? 'fragment' : 'fragments' }}</p>
      <p v-if="loading" class="empty">Opening the page…</p>
      <p v-else-if="fragments.length === 0" class="empty">Nothing here yet. Start with one small thought.</p>
      <FragmentEntry v-for="fragment in fragments" :key="fragment.id" :fragment="fragment" @update="update" @remove="remove" />
    </section>
    </div>
  </main>
</template>
