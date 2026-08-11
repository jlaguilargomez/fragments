<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Fragment } from '@fragments/shared';
import { authApi, fragmentsApi, isVisualDemo } from './api';
import type { AuthSession } from '@fragments/shared';
import { displayDate, shiftDate, toDateKey } from './date';
import FragmentComposer from './components/FragmentComposer.vue';
import FragmentEntry from './components/FragmentEntry.vue';
import AuthPanel from './components/AuthPanel.vue';

const selectedDate = ref(toDateKey(new Date()));
const fragments = ref<Fragment[]>([]);
const loading = ref(false);
const error = ref('');
const session = ref<AuthSession | null>(null);
const checkingSession = ref(!isVisualDemo);
async function load() {
  if (!isVisualDemo && !session.value) return;
  loading.value = true; error.value = '';
  try { fragments.value = await fragmentsApi.list(selectedDate.value); }
  catch (caught) { error.value = caught instanceof Error ? caught.message : 'Could not load your fragments.'; }
  finally { loading.value = false; }
}
async function save(input: { title: string; content: string }): Promise<boolean> {
  try {
    await fragmentsApi.create(input);
    await load();
    return true;
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not save your fragment.';
    return false;
  }
}
async function update(id: string, input: { title: string; content: string }) {
  try { await fragmentsApi.update(id, input); await load(); } catch (caught) { error.value = caught instanceof Error ? caught.message : 'Could not update your fragment.'; }
}
async function remove(id: string) {
  if (!window.confirm('Delete this fragment?')) return;
  try { await fragmentsApi.remove(id); await load(); } catch (caught) { error.value = caught instanceof Error ? caught.message : 'Could not delete your fragment.'; }
}
watch(selectedDate, load);
onMounted(async () => { if (isVisualDemo) { await load(); return; } try { session.value = await authApi.session(); } catch { session.value = null; } finally { checkingSession.value = false; if (session.value) await load(); } });
async function signOut() { await authApi.logout(); session.value = null; fragments.value = []; }
</script>

<template>
  <AuthPanel v-if="!isVisualDemo && !checkingSession && !session" @authenticated="session = $event; load()" />
  <main v-else class="workspace">
    <header class="topbar">
      <div class="brand"><span class="brand-mark" aria-hidden="true">✦</span><span>Fragments</span></div>
      <p>{{ isVisualDemo ? 'Visual demo · changes are temporary' : session?.user.email }} <button v-if="session" class="text-button" @click="signOut">Sign out</button></p>
    </header>
    <div class="page">
      <section class="page-heading">
        <p class="eyebrow">Daily notes</p>
        <nav class="day-nav" aria-label="Date navigation">
          <button class="day-button" aria-label="Previous day" @click="selectedDate = shiftDate(selectedDate, -1)">‹</button>
          <h1>{{ selectedDate === toDateKey(new Date()) ? 'Today' : displayDate(selectedDate) }}</h1>
          <button class="day-button" aria-label="Next day" @click="selectedDate = shiftDate(selectedDate, 1)">›</button>
        </nav>
        <p class="date-label">{{ displayDate(selectedDate) }}</p>
      </section>
      <section class="capture" aria-label="Write a fragment"><FragmentComposer :save-fragment="save" /></section>
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
