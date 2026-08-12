<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
const emit = defineEmits<{ save: [input: { title: string; content: string }]; cancel: [] }>();
const props = withDefaults(defineProps<{
  initialTitle?: string | null;
  initialContent?: string;
  submitLabel?: string;
  compact?: boolean;
  saveFragment?: (input: { title: string; content: string }) => Promise<boolean>;
  transcribeFragment?: (audio: Blob) => Promise<boolean>;
}>(), { initialTitle: '', initialContent: '', submitLabel: 'Save fragment', compact: false, saveFragment: undefined });
const MAX_RECORDING_SECONDS = 300;
const title = ref(props.initialTitle ?? '');
const content = ref(props.initialContent);
const recordingState = ref<'idle' | 'recording' | 'paused' | 'transcribing'>('idle');
const recordingError = ref('');
const elapsedSeconds = ref(0);
let recorder: MediaRecorder | undefined;
let stream: MediaStream | undefined;
let chunks: Blob[] = [];
let timer: number | undefined;
let discardRecording = false;
const recordingLabel = computed(() => `${Math.floor(elapsedSeconds.value / 60)}:${String(elapsedSeconds.value % 60).padStart(2, '0')}`);
async function submit() {
  if (!content.value.trim() || recordingState.value !== 'idle') return;
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
function clearRecordingResources() {
  stream?.getTracks().forEach(track => track.stop());
  stream = undefined;
  recorder = undefined;
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
}
function resetRecording() {
  clearRecordingResources(); chunks = []; elapsedSeconds.value = 0; recordingState.value = 'idle'; discardRecording = false;
}
function supportedMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
  return candidates.find(type => MediaRecorder.isTypeSupported(type));
}
async function startRecording() {
  recordingError.value = '';
  if (!props.transcribeFragment || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { recordingError.value = 'Voice recording is not supported in this browser.'; return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = supportedMimeType();
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks = []; elapsedSeconds.value = 0; discardRecording = false;
    recorder.ondataavailable = event => { if (event.data.size > 0) chunks.push(event.data); };
    recorder.onstop = async () => {
      const shouldDiscard = discardRecording;
      const blob = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' });
      clearRecordingResources();
      chunks = [];
      if (shouldDiscard || blob.size === 0) { resetRecording(); return; }
      recordingState.value = 'transcribing';
      try { await props.transcribeFragment?.(blob); } catch (caught) { recordingError.value = caught instanceof Error ? caught.message : 'Could not transcribe your recording.'; }
      resetRecording();
    };
    recorder.start(); recordingState.value = 'recording';
    timer = window.setInterval(() => { elapsedSeconds.value += 1; if (elapsedSeconds.value >= MAX_RECORDING_SECONDS) stopRecording(); }, 1000);
  } catch (caught) { clearRecordingResources(); recordingError.value = caught instanceof Error ? caught.message : 'Microphone permission is required.'; }
}
function togglePause() {
  if (!recorder) return;
  if (recordingState.value === 'recording') { recorder.pause(); recordingState.value = 'paused'; }
  else if (recordingState.value === 'paused') { recorder.resume(); recordingState.value = 'recording'; }
}
function stopRecording() { if (recorder && recorder.state !== 'inactive') recorder.stop(); }
function cancelRecording() { discardRecording = true; if (recorder && recorder.state !== 'inactive') recorder.stop(); else resetRecording(); }
onUnmounted(() => { discardRecording = true; if (recorder && recorder.state !== 'inactive') recorder.stop(); else clearRecordingResources(); });
</script>

<template>
  <form class="composer" :class="{ compact }" @submit.prevent="submit">
    <label class="composer-title-label" for="fragment-title">Title (optional)</label>
    <input id="fragment-title" v-model="title" aria-label="Fragment title" placeholder="What is on your mind?" maxlength="200" />
    <textarea v-model="content" aria-label="Fragment content" placeholder="What is on your mind?" :rows="compact ? 4 : 7" maxlength="20000" required />
    <div v-if="!compact && transcribeFragment" class="voice-capture" aria-live="polite">
      <template v-if="recordingState === 'idle'">
        <button class="text-button voice-button" type="button" @click="startRecording">Record voice</button>
        <span class="voice-hint">Short recordings are transcribed and then discarded.</span>
      </template>
      <template v-else-if="recordingState === 'transcribing'">
        <span class="voice-status">Transcribing…</span>
      </template>
      <template v-else>
        <span class="recording-indicator" :class="{ paused: recordingState === 'paused' }" aria-hidden="true"></span>
        <span class="voice-status">{{ recordingState === 'paused' ? 'Paused' : 'Recording' }} · {{ recordingLabel }}</span>
        <button class="text-button" type="button" @click="togglePause">{{ recordingState === 'paused' ? 'Resume' : 'Pause' }}</button>
        <button class="text-button" type="button" @click="stopRecording">Use recording</button>
        <button class="text-button danger" type="button" @click="cancelRecording">Cancel</button>
      </template>
      <p v-if="recordingError" class="voice-error" role="alert">{{ recordingError }}</p>
    </div>
    <div class="composer-actions">
      <button v-if="compact" class="text-button" type="button" @click="emit('cancel')">Cancel</button>
      <button class="save-button" type="submit" :disabled="recordingState !== 'idle'">{{ submitLabel }}</button>
    </div>
  </form>
</template>
