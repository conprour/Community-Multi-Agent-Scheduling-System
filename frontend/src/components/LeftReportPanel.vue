<template>
  <section class="panel card-panel left-panel">
    <header class="panel-header compact-header">
      <div>
        <p class="eyebrow">居民侧输入</p>
        <h2>对话受理台</h2>
      </div>
      <el-tag type="warning" effect="light">{{ store.selectedCase.title }}</el-tag>
    </header>

    <section class="chat-box">
      <textarea
        v-model="store.form.description"
        class="chat-textarea"
        placeholder="直接描述急事，例如：2栋3单元4楼水管爆了，地上全是水，怕漏到电梯里。"
      />

      <div v-if="store.pendingFiles.length" class="inline-files">
        <article v-for="(file, index) in store.pendingFiles" :key="file.name + file.size + index" class="inline-file">
          <span>{{ file.name }}</span>
          <button type="button" @click="store.removePendingFile(index)">移除</button>
        </article>
      </div>

      <div v-if="liveTranscript" class="speech-preview">{{ liveTranscript }}</div>

      <div class="composer-toolbar">
        <div class="composer-tools">
          <label class="tool-button">
            <input class="hidden-input" type="file" accept="image/*" multiple @change="handleImageChange" />
            <span>上传图像</span>
          </label>
          <button type="button" class="tool-button" :class="{ active: isListening }" @click="toggleSpeechRecognition">
            {{ isListening ? '停止识别' : '语音识别' }}
          </button>
        </div>

        <button type="button" class="send-button" :disabled="store.submitting" @click="store.submitCurrentReport()">
          {{ store.submitting ? '分析中' : '发送' }}
        </button>
      </div>
    </section>

    <section class="agent-analysis">
      <div class="analysis-topline">
        <span>诉求接受 Agent</span>
        <strong>{{ store.stageLabel }}</strong>
      </div>
      <p class="analysis-notice">{{ store.notice }}</p>

      <template v-if="store.response">
        <div class="analysis-summary">
          <span>{{ store.response.demand_package.category }}</span>
          <span>{{ urgencyLabel }}</span>
          <span>{{ store.response.demand_package.location }}</span>
        </div>
        <p class="summary-text">{{ store.response.demand_package.summary }}</p>
        <div class="analysis-grid">
          <article>
            <strong>{{ store.response.demand_package.requires_immediate_visit ? '立即上门' : '先行核实' }}</strong>
            <span>处置建议</span>
          </article>
          <article>
            <strong>{{ store.response.demand_package.risks.length }}</strong>
            <span>风险点</span>
          </article>
          <article>
            <strong>{{ store.response.demand_package.temporary_guidance.length }}</strong>
            <span>临时建议</span>
          </article>
        </div>
        <ul class="analysis-list">
          <li v-for="risk in store.response.demand_package.risks" :key="risk">{{ risk }}</li>
        </ul>
      </template>

      <template v-else>
        <div class="case-preview">
          <strong>{{ store.selectedCase.source }} · {{ store.selectedCase.location }}</strong>
          <p>{{ store.selectedCase.brief }}</p>
          <div class="tag-row">
            <span v-for="tag in store.selectedCase.tags" :key="tag">{{ tag }}</span>
          </div>
        </div>
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import { useEmergencyStore } from '@/stores/emergency';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const store = useEmergencyStore();
const isListening = ref(false);
const liveTranscript = ref('');
let recognition: SpeechRecognitionLike | null = null;

const urgencyLabel = computed(() => {
  const urgency = store.response?.demand_package.urgency;
  if (urgency === 'high') {
    return '高紧急度';
  }
  if (urgency === 'medium') {
    return '中紧急度';
  }
  return '低紧急度';
});

function handleImageChange(event: Event) {
  const target = event.target as HTMLInputElement;
  store.setPendingFiles(Array.from(target.files ?? []));
  target.value = '';
}

function toggleSpeechRecognition() {
  if (isListening.value) {
    recognition?.stop();
    return;
  }

  const RecognitionConstructor = getSpeechRecognitionConstructor();
  if (!RecognitionConstructor) {
    store.notice = '当前浏览器不支持实时语音识别，可先输入文字或上传图片。';
    return;
  }

  recognition = new RecognitionConstructor();
  recognition.lang = 'zh-CN';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = handleSpeechResult;
  recognition.onerror = () => {
    isListening.value = false;
    store.notice = '语音识别中断，请重试或改用文字输入。';
  };
  recognition.onend = () => {
    isListening.value = false;
    liveTranscript.value = '';
  };
  recognition.start();
  isListening.value = true;
  store.form.input_type = 'audio';
  store.notice = '正在实时识别语音，识别结果会自动写入对话框。';
}

function handleSpeechResult(event: SpeechRecognitionEventLike) {
  let finalText = '';
  let interimText = '';

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result[0]?.transcript ?? '';
    if (result.isFinal) {
      finalText += transcript;
    } else {
      interimText += transcript;
    }
  }

  liveTranscript.value = interimText;
  if (finalText) {
    store.appendSpeechText(finalText);
  }
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

onBeforeUnmount(() => {
  recognition?.stop();
});
</script>

<style scoped>
.left-panel {
  display: grid;
  gap: 18px;
}

.compact-header {
  align-items: center;
}

.chat-box {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 251, 246, 0.96), rgba(242, 249, 250, 0.9));
  border: 1px solid rgba(211, 225, 231, 0.9);
}

.chat-textarea {
  width: 100%;
  min-height: 190px;
  resize: vertical;
  border: none;
  outline: none;
  background: rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  padding: 16px;
  color: #17313d;
  font: inherit;
  line-height: 1.7;
}

.chat-textarea::placeholder {
  color: rgba(63, 88, 100, 0.48);
}

.composer-toolbar,
.composer-tools,
.inline-file,
.analysis-topline,
.analysis-summary,
.tag-row {
  display: flex;
  align-items: center;
}

.composer-toolbar {
  justify-content: space-between;
  gap: 12px;
}

.composer-tools {
  flex-wrap: wrap;
  gap: 10px;
}

.tool-button,
.send-button,
.inline-file button {
  border: none;
  cursor: pointer;
  font: inherit;
}

.tool-button {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 8px 13px;
  border-radius: 999px;
  background: rgba(236, 128, 60, 0.12);
  color: #cf641e;
}

.tool-button.active {
  background: rgba(29, 131, 145, 0.14);
  color: #147080;
}

.send-button {
  min-height: 38px;
  padding: 9px 18px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #f08c46, #df6827);
}

.send-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.hidden-input {
  display: none;
}

.inline-files {
  display: grid;
  gap: 8px;
}

.inline-file {
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 14px;
  background: rgba(236, 244, 246, 0.88);
  color: #284755;
  font-size: 13px;
}

.inline-file button {
  color: #cf641e;
  background: transparent;
}

.speech-preview {
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(30, 137, 151, 0.1);
  color: #176d79;
  line-height: 1.6;
}

.agent-analysis {
  min-height: 360px;
  display: grid;
  align-content: start;
  gap: 14px;
  border-radius: 24px;
  padding: 20px;
  background: linear-gradient(180deg, rgba(255, 222, 197, 0.62), rgba(255, 248, 241, 0.92));
  border: 1px solid rgba(239, 171, 119, 0.46);
}

.analysis-topline {
  justify-content: space-between;
  gap: 14px;
  color: rgba(62, 80, 90, 0.86);
  font-size: 13px;
}

.analysis-notice,
.summary-text,
.case-preview p {
  margin: 0;
  color: rgba(52, 75, 87, 0.86);
  line-height: 1.7;
}

.analysis-summary,
.tag-row {
  flex-wrap: wrap;
  gap: 10px;
}

.analysis-summary span,
.tag-row span {
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  color: #274958;
  font-size: 12px;
}

.summary-text {
  font-weight: 600;
  color: #17313d;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.analysis-grid article {
  padding: 13px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
}

.analysis-grid strong,
.analysis-grid span,
.case-preview strong {
  display: block;
}

.analysis-grid strong {
  color: #17313d;
}

.analysis-grid span {
  margin-top: 4px;
  color: rgba(58, 82, 94, 0.74);
  font-size: 12px;
}

.analysis-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(52, 75, 87, 0.88);
  line-height: 1.8;
}

.case-preview {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.48);
}

.case-preview strong {
  color: #17313d;
}

@media (max-width: 900px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }
}
</style>