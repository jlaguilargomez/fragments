<script setup lang="ts">
import { ref } from 'vue';
import type { Fragment } from '@fragments/shared';
import { displayTime } from '@/date';
import FragmentComposer from './FragmentComposer.vue';
defineProps<{ fragment: Fragment }>();
const emit = defineEmits<{ update: [id: string, input: { title: string; content: string }]; remove: [id: string] }>();
const editing = ref(false);
</script>

<template>
  <article class="fragment-entry">
    <time :datetime="fragment.createdAt">{{ displayTime(fragment.createdAt) }}</time>
    <FragmentComposer v-if="editing" compact :initial-title="fragment.title" :initial-content="fragment.content" submit-label="Save changes" @save="input => { emit('update', fragment.id, input); editing = false }" @cancel="editing = false" />
    <div v-else class="fragment-body">
      <h2 v-if="fragment.title">{{ fragment.title }}</h2>
      <p>{{ fragment.content }}</p>
      <div class="entry-actions">
        <button class="text-button" @click="editing = true">Edit</button>
        <button class="text-button danger" @click="emit('remove', fragment.id)">Delete</button>
      </div>
    </div>
  </article>
</template>
