<template>
  <section class="panel card-panel left-panel">
    <header class="panel-header compact-header">
      <div>
        <p class="eyebrow">居民侧输入</p>
        <h2>对话受理台</h2>
      </div>
      <el-tag type="warning" effect="light">{{ store.selectedCase.title }}</el-tag>
    </header>

    <section class="chat-box" :class="{ highlighted: store.chatHighlighted }">
      <div v-if="store.workOrderConfirmationNotice" class="order-confirmation-pop">
        <strong>用户已确认工单</strong>
        <span>{{ store.response?.service_order.order_id }}</span>
      </div>

      <div class="message-history">
        <article
          v-for="message in store.chatMessages"
          :key="message.id"
          class="message-bubble"
          :class="[message.role, message.variant]"
        >
          <span class="message-author">{{ message.role === 'user' ? '居民' : '客服' }}</span>
          <p>{{ message.content }}</p>
          <div v-if="message.attachments?.length" class="message-files">
            <span v-for="file in message.attachments" :key="file">{{ file }}</span>
          </div>
        </article>
      </div>

      <div v-if="store.pendingFiles.length" class="inline-files">
        <article v-for="(file, index) in store.pendingFiles" :key="file.name + file.size + index" class="inline-file">
          <span>{{ file.name }}</span>
          <button type="button" @click="store.removePendingFile(index)">移除</button>
        </article>
      </div>

      <div v-if="liveTranscript" class="speech-preview">{{ liveTranscript }}</div>

      <div class="composer-card">
        <textarea
          v-model="store.draftMessage"
          class="chat-textarea"
          placeholder="继续补充诉求，例如：餐馆叫川香小厨，门牌是 12 号，晚上十点后最吵。"
          :disabled="store.submitting"
          @keydown.enter="handleTextareaEnter"
        />

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
            {{ store.submitting ? '判断中' : '发送' }}
          </button>
        </div>
      </div>
    </section>

    <section class="agent-analysis" :class="{ highlighted: store.feedbackHighlighted }">
      <div class="analysis-topline">
        <span>受理反馈</span>
        <strong>{{ store.stageLabel }}</strong>
      </div>
      <p class="analysis-notice">{{ store.notice }}</p>

      <template v-if="feedbackResult">
        <div class="analysis-summary">
          <span>{{ feedbackResult.demand_package.category }}</span>
          <span>{{ urgencyLabel }}</span>
          <span>{{ feedbackResult.demand_package.location }}</span>
        </div>
        <p class="summary-text">{{ feedbackResult.demand_package.summary }}</p>
        <div class="analysis-grid">
          <article>
            <strong>{{ feedbackResult.demand_package.requires_immediate_visit ? '立即上门' : '先行核实' }}</strong>
            <span>处置建议</span>
          </article>
          <article>
            <strong>{{ feedbackResult.demand_package.risks.length }}</strong>
            <span>风险点</span>
          </article>
          <article>
            <strong>{{ feedbackResult.demand_package.temporary_guidance.length }}</strong>
            <span>临时建议</span>
          </article>
        </div>
        <ul class="analysis-list">
          <li v-for="risk in feedbackResult.demand_package.risks" :key="risk">{{ risk }}</li>
        </ul>
      </template>

      <template v-else>
        <div class="case-preview">
          <strong>{{ store.selectedCase.source }} · {{ store.selectedCase.communityName }}</strong>
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

const feedbackResult = computed(() => store.feedbackResult);
const urgencyLabel = computed(() => {
  const urgency = feedbackResult.value?.demand_package.urgency;
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

function handleTextareaEnter(event: KeyboardEvent) {
  if (event.isComposing) {
    return;
  }

  if (event.ctrlKey || event.altKey) {
    event.preventDefault();
    insertLineBreak(event.target as HTMLTextAreaElement);
    return;
  }

  event.preventDefault();
  if (!store.submitting) {
    void store.submitCurrentReport();
  }
}

function insertLineBreak(textarea: HTMLTextAreaElement) {
  const start = textarea.selectionStart ?? store.draftMessage.length;
  const end = textarea.selectionEnd ?? start;
  store.draftMessage = `${store.draftMessage.slice(0, start)}\n${store.draftMessage.slice(end)}`;

  requestAnimationFrame(() => {
    textarea.setSelectionRange(start + 1, start + 1);
  });
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
  gap: 16px;
}

.compact-header {
  align-items: center;
}

.chat-box {
  min-height: 520px;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 12px;
  padding: 16px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 251, 246, 0.96), rgba(242, 249, 250, 0.9));
  border: 1px solid rgba(211, 225, 231, 0.9);
  transition: border-color 0.24s ease, box-shadow 0.24s ease, transform 0.24s ease;
}

.chat-box.highlighted {
  border-color: rgba(235, 127, 56, 0.96);
  box-shadow: 0 0 0 6px rgba(235, 127, 56, 0.18), 0 24px 42px rgba(235, 127, 56, 0.2);
  transform: translateY(-2px);
}

.order-confirmation-pop {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(232, 250, 241, 0.98), rgba(239, 248, 250, 0.98));
  border: 1px solid rgba(54, 155, 95, 0.52);
  box-shadow: 0 16px 28px rgba(54, 155, 95, 0.14);
}

.order-confirmation-pop strong {
  color: #197a5c;
}

.order-confirmation-pop span {
  color: rgba(52, 75, 87, 0.78);
  font-size: 13px;
}

.message-history {
  max-height: 330px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.message-bubble {
  max-width: 88%;
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(210, 223, 230, 0.72);
}

.message-bubble.user {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(255, 226, 205, 0.96), rgba(255, 246, 239, 0.96));
  border-color: rgba(238, 154, 91, 0.38);
}

.message-bubble.agent {
  align-self: flex-start;
}

.message-bubble.question {
  border-color: rgba(235, 127, 56, 0.72);
  background: rgba(255, 244, 233, 0.96);
  box-shadow: 0 10px 22px rgba(235, 127, 56, 0.13);
}

.message-bubble.success {
  border-color: rgba(31, 138, 151, 0.38);
  background: rgba(235, 247, 248, 0.96);
}

.message-author {
  color: rgba(61, 84, 95, 0.68);
  font-size: 12px;
  font-weight: 600;
}

.message-bubble p {
  margin: 0;
  color: #17313d;
  line-height: 1.65;
}

.message-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.message-files span {
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(237, 244, 247, 0.86);
  color: rgba(54, 82, 94, 0.78);
  font-size: 12px;
}

.composer-card {
  display: grid;
  gap: 10px;
  border-radius: 18px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(210, 223, 230, 0.78);
}

.chat-textarea {
  width: 100%;
  min-height: 88px;
  resize: vertical;
  border: none;
  outline: none;
  background: transparent;
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
  min-height: 34px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(236, 128, 60, 0.12);
  color: #cf641e;
}

.tool-button.active {
  background: rgba(29, 131, 145, 0.14);
  color: #147080;
}

.send-button {
  min-height: 36px;
  padding: 8px 17px;
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
  min-height: 250px;
  display: grid;
  align-content: start;
  gap: 12px;
  border-radius: 24px;
  padding: 18px;
  background: linear-gradient(180deg, rgba(255, 222, 197, 0.44), rgba(255, 248, 241, 0.88));
  border: 1px solid rgba(239, 171, 119, 0.32);
  transition: border-color 0.24s ease, box-shadow 0.24s ease, transform 0.24s ease;
}

.agent-analysis.highlighted {
  border-color: rgba(31, 138, 151, 0.86);
  box-shadow: 0 0 0 6px rgba(31, 138, 151, 0.16), 0 22px 40px rgba(31, 138, 151, 0.16);
  transform: translateY(-2px);
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
  padding: 12px;
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