<template>
  <section class="panel card-panel left-panel">
    <header class="panel-header">
      <div>
        <p class="eyebrow">群众诉求区</p>
        <h2>12345 接诉输入</h2>
      </div>
      <el-tag type="danger" effect="dark">主案例</el-tag>
    </header>

    <el-form label-position="top" class="report-form">
      <el-form-item label="诉求人">
        <el-input v-model="store.form.reporter_name" placeholder="例如：李女士" />
      </el-form-item>

      <el-form-item label="联系方式">
        <el-input v-model="store.form.contact" placeholder="用于回访或确认现场情况" />
      </el-form-item>

      <el-form-item label="发生位置">
        <el-input v-model="store.form.location" placeholder="例如：中关村街道知春里社区 A 区底商" />
      </el-form-item>

      <el-form-item label="输入方式">
        <el-radio-group v-model="store.form.input_type" class="input-type-group">
          <el-radio-button label="text">文本</el-radio-button>
          <el-radio-button label="audio">语音</el-radio-button>
          <el-radio-button label="image">图像</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <section class="mode-tips">
        <div class="mode-tip-card" :class="{ active: store.form.input_type === 'text' }">
          <strong>文本</strong>
        <span>适合快速描述地点、商户、时间段和诉求经过。</span>
        </div>
        <div class="mode-tip-card" :class="{ active: store.form.input_type === 'audio' }">
          <strong>语音</strong>
          <span>上传音频后由百炼 ASR 转写，再进入结构化识别。</span>
        </div>
        <div class="mode-tip-card" :class="{ active: store.form.input_type === 'image' }">
          <strong>图像</strong>
          <span>上传现场照片后由 VLM 辅助判断风险和处置提示。</span>
        </div>
      </section>

      <el-form-item label="诉求描述">
        <el-input
          v-model="store.form.description"
          type="textarea"
          :rows="5"
          :placeholder="descriptionPlaceholder"
        />
      </el-form-item>

      <el-form-item label="附件上传">
        <div class="upload-panel">
          <label class="upload-dropzone">
            <input class="hidden-input" type="file" :accept="acceptedTypes" multiple @change="handleFileChange" />
            <span class="upload-icon">+</span>
            <strong>{{ uploadLabel }}</strong>
            <small>支持多文件；提交时先上传到后端，再调用百炼识别。</small>
          </label>

          <div v-if="store.pendingFiles.length" class="file-list">
            <article v-for="(file, index) in store.pendingFiles" :key="file.name + file.size + index" class="file-chip">
              <div>
                <strong>{{ file.name }}</strong>
                <span>{{ formatFileSize(file.size) }}</span>
              </div>
              <button type="button" class="remove-file-btn" @click="store.removePendingFile(index)">移除</button>
            </article>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="辅助标签">
        <el-checkbox-group v-model="store.form.tags" class="tag-grid">
          <el-checkbox v-for="tag in presetTags" :key="tag" :label="tag">{{ tag }}</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>

    <div class="panel-actions">
      <el-button type="primary" :loading="store.submitting" @click="store.submitCurrentReport()">
        提交诉求
      </el-button>
      <el-button plain @click="store.resetDemo()">恢复默认案例</el-button>
    </div>

    <section class="insight-card">
      <div class="insight-topline">
      <span>受理 Agent</span>
        <strong>{{ store.stageLabel }}</strong>
      </div>
      <p class="insight-notice">{{ store.notice }}</p>

      <template v-if="store.response">
        <div class="demand-package">
          <div class="package-chip-row">
            <span class="package-chip">{{ store.response.demand_package.category }}</span>
            <span class="package-chip urgency-chip">{{ urgencyLabel }}</span>
            <span class="package-chip">{{ store.response.demand_package.location }}</span>
          </div>
          <p class="package-summary">{{ store.response.demand_package.summary }}</p>
          <div class="mini-metrics">
            <div>
              <strong>{{ store.response.demand_package.requires_immediate_visit ? '需要' : '暂不需要' }}</strong>
              <span>立即上门</span>
            </div>
            <div>
              <strong>{{ store.response.demand_package.missing_fields.length }}</strong>
              <span>待补信息</span>
            </div>
            <div>
              <strong>{{ store.response.demand_package.temporary_guidance.length }}</strong>
              <span>临时建议</span>
            </div>
          </div>
          <ul class="package-list">
            <li v-for="risk in store.response.demand_package.risks" :key="risk">{{ risk }}</li>
          </ul>
        </div>
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useEmergencyStore } from '@/stores/emergency';

const store = useEmergencyStore();
const presetTags = ['油烟扰民', '夜间噪声', '物业协调', '重复投诉', '多部门协同'];

const acceptedTypes = computed(() => {
  if (store.form.input_type === 'audio') {
    return 'audio/*';
  }
  if (store.form.input_type === 'image') {
    return 'image/*';
  }
  return 'image/*,audio/*';
});

const descriptionPlaceholder = computed(() => {
  if (store.form.input_type === 'audio') {
    return '可补充文字说明，或直接上传语音文件由系统转写。';
  }
  if (store.form.input_type === 'image') {
    return '可补充图片背景说明，或直接上传现场照片。';
  }
  return '请描述具体发生了什么、在哪儿、涉及哪些商户或部门。';
});

const uploadLabel = computed(() => {
  if (store.form.input_type === 'audio') {
    return '点击选择语音文件';
  }
  if (store.form.input_type === 'image') {
    return '点击选择现场图片';
  }
  return '可上传图片或语音作为辅助材料';
});

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

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  store.setPendingFiles(files);
  target.value = '';
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
</script>

<style scoped>
.left-panel {
  display: grid;
  gap: 22px;
}

.report-form {
  display: grid;
  gap: 2px;
}

.mode-tips {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 4px;
}

.mode-tip-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid rgba(180, 198, 208, 0.55);
  color: #35505b;
}

.mode-tip-card strong {
  color: #16333d;
}

.mode-tip-card span {
  font-size: 12px;
  line-height: 1.6;
}

.mode-tip-card.active {
  background: linear-gradient(135deg, rgba(255, 188, 140, 0.46), rgba(123, 196, 206, 0.2));
  border-color: rgba(240, 138, 70, 0.5);
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.input-type-group {
  display: inline-flex;
}

.upload-panel {
  display: grid;
  gap: 12px;
}

.upload-dropzone {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  border: 1px dashed rgba(235, 145, 74, 0.45);
  background: linear-gradient(135deg, rgba(255, 248, 240, 0.88), rgba(233, 244, 246, 0.72));
  color: #244351;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.upload-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(238, 127, 56, 0.14);
  color: #de6c24;
  font-size: 22px;
}

.upload-dropzone strong {
  font-size: 15px;
}

.upload-dropzone small {
  color: rgba(39, 71, 83, 0.76);
  line-height: 1.6;
}

.file-list {
  display: grid;
  gap: 10px;
}

.file-chip {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(243, 248, 250, 0.92);
  border: 1px solid rgba(188, 206, 214, 0.6);
}

.file-chip strong,
.file-chip span {
  display: block;
}

.file-chip strong {
  color: #1d3741;
  font-size: 13px;
}

.file-chip span {
  margin-top: 4px;
  color: rgba(56, 82, 94, 0.72);
  font-size: 12px;
}

.remove-file-btn {
  border: none;
  background: rgba(222, 108, 36, 0.12);
  color: #d1611d;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
}

.insight-card {
  border-radius: 20px;
  padding: 20px;
  background: linear-gradient(180deg, rgba(255, 176, 122, 0.34), rgba(255, 246, 237, 0.9));
  border: 1px solid rgba(239, 167, 116, 0.4);
}

.insight-topline {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  font-size: 13px;
  color: rgba(62, 80, 90, 0.86);
}

.insight-notice {
  margin: 14px 0 0;
  color: rgba(68, 87, 97, 0.88);
  line-height: 1.6;
}

.demand-package {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}

.package-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.package-chip {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #f5fbff;
}

.urgency-chip {
  background: rgba(255, 126, 82, 0.24);
}

.package-summary {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: #223a44;
}

.mini-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.mini-metrics div {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
}

.mini-metrics strong,
.mini-metrics span {
  display: block;
}

.mini-metrics strong {
  color: #14333d;
  font-size: 16px;
}

.mini-metrics span {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(59, 82, 94, 0.74);
}

.package-list {
  margin: 0;
  padding-left: 18px;
  color: rgba(52, 75, 87, 0.88);
  line-height: 1.8;
}

@media (max-width: 900px) {
  .mode-tips,
  .mini-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
