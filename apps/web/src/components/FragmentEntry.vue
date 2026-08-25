<script setup lang="ts">
import { ref } from 'vue';
import type { Fragment } from '@fragments/shared';
import { displayDate, displayTime } from '@/date';
import FragmentComposer from './FragmentComposer.vue';
import { locale, t } from '../i18n';
const props = withDefaults(defineProps<{ fragment: Fragment; showDate?: boolean; availableContexts?: string[] }>(), { showDate: false, availableContexts: () => [] });
const emit = defineEmits<{ update: [id: string, input: { title: string; content: string; contexts: string[] }]; remove: [id: string] }>();
const editing = ref(false);
</script>

<template>
  <article class="fragment-entry">
    <time :datetime="fragment.createdAt">{{ props.showDate ? displayDate(fragment.createdAt.slice(0, 10), locale === 'es' ? 'es-ES' : 'en-US') : displayTime(fragment.createdAt, locale === 'es' ? 'es-ES' : 'en-US') }}</time>
    <FragmentComposer v-if="editing" compact :initial-title="fragment.title" :initial-content="fragment.content" :initial-contexts="fragment.contexts" :available-contexts="props.availableContexts" :submit-label="t('saveChanges')" @save="input => { emit('update', fragment.id, input); editing = false }" @cancel="editing = false" />
    <div v-else class="fragment-body">
      <h2 v-if="fragment.title">{{ fragment.title }}</h2>
      <p>{{ fragment.content }}</p>
      <div v-if="fragment.contexts.length" class="entry-contexts"><span v-for="context in fragment.contexts" :key="context" class="context-chip">{{ context }}</span></div>
      <div class="entry-actions">
        <button class="entry-action-button" @click="editing = true">{{ t('edit') }}</button>
        <button class="entry-action-button danger" @click="emit('remove', fragment.id)">{{ t('delete') }}</button>
      </div>
    </div>
  </article>
</template>
