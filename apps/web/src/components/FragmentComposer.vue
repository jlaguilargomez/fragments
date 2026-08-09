<script setup lang="ts">
import { ref } from 'vue';
const emit = defineEmits<{ save: [input: { title: string; content: string }]; cancel: [] }>();
const props = withDefaults(defineProps<{
  initialTitle?: string | null;
  initialContent?: string;
  submitLabel?: string;
  compact?: boolean;
  saveFragment?: (input: { title: string; content: string }) => Promise<boolean>;
}>(), { initialTitle: '', initialContent: '', submitLabel: 'Save fragment', compact: false, saveFragment: undefined });
const title = ref(props.initialTitle ?? '');
const content = ref(props.initialContent);
async function submit() {
  if (!content.value.trim()) return;
  const input = { title: title.value, content: content.value };
  if (props.saveFragment) {
    const saved = await props.saveFragment(input);
    if (saved) {
      title.value = '';
      content.value = '';
    }
    return;
  }
  emit('save', input);
}
</script>

<template>
  <form class="composer" :class="{ compact }" @submit.prevent="submit">
    <input v-model="title" aria-label="Fragment title" placeholder="Title (optional)" maxlength="200" />
    <textarea v-model="content" aria-label="Fragment content" placeholder="What is on your mind?" :rows="compact ? 4 : 7" maxlength="20000" required />
    <div class="composer-actions">
      <button v-if="compact" class="text-button" type="button" @click="emit('cancel')">Cancel</button>
      <button class="save-button" type="submit">{{ submitLabel }}</button>
    </div>
  </form>
</template>
