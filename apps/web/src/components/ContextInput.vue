<script setup lang="ts">
import { computed, ref } from 'vue';
import { t } from '../i18n';

const props = withDefaults(defineProps<{ modelValue: string[]; suggestions?: string[]; compact?: boolean }>(), { suggestions: () => [], compact: false });
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const draft = ref('');
const focused = ref(false);

const normalized = (value: string) => value.trim().replace(/\s+/g, ' ');
const matches = computed(() => {
  const query = draft.value.trim().toLocaleLowerCase();
  return props.suggestions.filter(value => !props.modelValue.some(current => current.toLocaleLowerCase() === value.toLocaleLowerCase()) && (!query || value.toLocaleLowerCase().includes(query))).slice(0, 7);
});
function add(value = draft.value) {
  const clean = normalized(value);
  if (!clean || clean.length > 60 || props.modelValue.some(current => current.toLocaleLowerCase() === clean.toLocaleLowerCase())) { draft.value = ''; return; }
  emit('update:modelValue', [...props.modelValue, clean].slice(0, 12)); draft.value = '';
}
function remove(value: string) { emit('update:modelValue', props.modelValue.filter(current => current !== value)); }
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(); }
  if (event.key === 'Backspace' && !draft.value && props.modelValue.length) remove(props.modelValue.at(-1)!);
}
function handleBlur() { setTimeout(() => { focused.value = false; }, 120); }
</script>

<template>
  <div class="context-field" :class="{ compact, 'is-focused': focused }">
    <label class="context-label">{{ t('contexts') }}</label>
    <div class="context-control">
      <span v-for="context in modelValue" :key="context" class="context-chip">
        <span>{{ context }}</span><button type="button" :aria-label="`${t('removeContext')} ${context}`" @click="remove(context)">×</button>
      </span>
      <input v-model="draft" :placeholder="modelValue.length ? t('addContext') : t('contextHint')" :aria-label="t('contexts')" maxlength="60" @focus="focused = true" @blur="handleBlur" @keydown="onKeydown" />
    </div>
    <div v-if="focused && matches.length" class="context-suggestions" role="listbox">
      <button v-for="suggestion in matches" :key="suggestion" type="button" role="option" @mousedown.prevent="add(suggestion)">{{ suggestion }}</button>
    </div>
    <small class="context-hint">{{ t('contextInputHint') }}</small>
  </div>
</template>
