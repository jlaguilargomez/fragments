<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Fragment } from '@fragments/shared';
import { t } from '../i18n';
import FragmentEntry from './FragmentEntry.vue';

const props = defineProps<{ fragments: Fragment[]; loading: boolean; error: string }>();
const emit = defineEmits<{ update: [id: string, input: { title: string; content: string; contexts: string[] }]; remove: [id: string]; rename: [from: string, to: string]; deleteContext: [context: string] }>();
const query = ref('');
const selected = ref('');
const renameValue = ref('');

const catalog = computed(() => {
  const counts = new Map<string, { name: string; count: number }>();
  for (const fragment of props.fragments) for (const context of fragment.contexts) {
    const key = context.toLocaleLowerCase(); const existing = counts.get(key);
    if (existing) existing.count += 1; else counts.set(key, { name: context, count: 1 });
  }
  return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
});
const suggestions = computed(() => catalog.value.map(item => item.name));
const matchingContexts = computed(() => {
  const value = query.value.trim().toLocaleLowerCase();
  return value ? catalog.value.filter(item => item.name.toLocaleLowerCase().includes(value)) : [];
});
const showSearchResults = computed(() => matchingContexts.value.length > 0 && selected.value.toLocaleLowerCase() !== query.value.trim().toLocaleLowerCase());
const results = computed(() => selected.value ? props.fragments.filter(fragment => fragment.contexts.some(context => context.toLocaleLowerCase() === selected.value.toLocaleLowerCase())) : []);
watch(catalog, items => {
  if (selected.value && !items.some(item => item.name.toLocaleLowerCase() === selected.value.toLocaleLowerCase())) {
    selected.value = '';
    query.value = '';
    renameValue.value = '';
  }
});
function choose(name: string) { selected.value = name; query.value = name; renameValue.value = name; }
function handleQueryInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  const exact = catalog.value.find(item => item.name.toLocaleLowerCase() === value.trim().toLocaleLowerCase());
  if (exact) choose(exact.name);
  else selected.value = '';
}
function selectFirstMatch(event: KeyboardEvent) {
  if (event.key === 'Enter' && matchingContexts.value.length) { event.preventDefault(); choose(matchingContexts.value[0].name); }
  if (event.key === 'Escape') query.value = selected.value;
}
function submitRename() { const next = renameValue.value.trim().replace(/\s+/g, ' '); if (selected.value && next && next.toLocaleLowerCase() !== selected.value.toLocaleLowerCase()) { emit('rename', selected.value, next); selected.value = next; query.value = next; } }
function removeSelected() { if (selected.value && window.confirm(t('deleteContextConfirm', { context: selected.value }))) { emit('deleteContext', selected.value); selected.value = ''; query.value = ''; } }
function forwardUpdate(id: string, input: { title: string; content: string; contexts: string[] }) { emit('update', id, input); }
</script>

<template>
  <section class="contexts-page">
    <div class="contexts-heading"><p class="eyebrow">{{ t('organiseGently') }}</p><h1>{{ t('contexts') }}</h1><p>{{ t('contextsIntro') }}</p></div>
    <div v-if="error" class="error" role="alert">{{ error }}</div>
    <div class="context-search-wrap">
      <label :for="'context-search'">{{ t('findContext') }}</label>
      <input id="context-search" v-model="query" role="combobox" :aria-expanded="showSearchResults" aria-controls="context-search-results" :placeholder="t('searchContexts')" autocomplete="off" @input="handleQueryInput" @keydown="selectFirstMatch" />
      <div v-if="showSearchResults" id="context-search-results" class="context-search-results" role="listbox">
        <button v-for="item in matchingContexts" :key="item.name" type="button" role="option" @click="choose(item.name)">{{ item.name }} <small>{{ item.count }}</small></button>
      </div>
    </div>
    <p v-if="loading" class="empty">{{ t('openingContexts') }}</p>
    <template v-else-if="catalog.length">
      <div class="context-catalog"><button v-for="item in catalog" :key="item.name" type="button" class="catalog-item" :class="{ selected: selected.toLocaleLowerCase() === item.name.toLocaleLowerCase() }" :aria-pressed="selected.toLocaleLowerCase() === item.name.toLocaleLowerCase()" @click="choose(item.name)"><span>{{ item.name }}</span><small>{{ item.count }}</small></button></div>
      <section v-if="selected" class="context-results">
        <div class="context-results-heading"><div><p class="eyebrow">{{ t('contextResults') }}</p><h2>{{ selected }}</h2></div><div class="context-management"><input v-model="renameValue" :aria-label="t('renameContext')" @keyup.enter="submitRename" /><button class="entry-action-button" type="button" @click="submitRename">{{ t('rename') }}</button><button class="entry-action-button danger" type="button" @click="removeSelected">{{ t('delete') }}</button></div></div>
        <p v-if="!results.length" class="empty">{{ t('noContextResults') }}</p>
        <FragmentEntry v-for="fragment in results" :key="fragment.id" :fragment="fragment" show-date :available-contexts="suggestions" @update="forwardUpdate" @remove="emit('remove', $event)" />
      </section>
    </template>
    <p v-else class="empty">{{ t('noContextsYet') }}</p>
  </section>
</template>
