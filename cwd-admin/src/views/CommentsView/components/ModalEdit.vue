<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal">
      <h3 class="modal-title">{{ t("comments.editModal.title") }}</h3>
      <div v-if="form" class="modal-body">
        <div class="form-item">
          <label class="form-label">{{ t("comments.editModal.name") }}</label>
          <input v-model="form.name" class="form-input" type="text" />
        </div>
        <div class="form-item">
          <label class="form-label">{{ t("comments.editModal.email") }}</label>
          <input v-model="form.email" class="form-input" type="email" />
        </div>
        <div class="form-item">
          <label class="form-label">{{ t("comments.editModal.url") }}</label>
          <input v-model="form.url" class="form-input" type="text" />
        </div>
        <div class="form-item">
          <label class="form-label">{{ t("comments.editModal.postSlug") }}</label>
          <input v-model="form.postSlug" class="form-input" type="text" />
        </div>
        <div class="form-item">
          <label class="form-label">{{ t("comments.editModal.postUrl") }}</label>
          <input v-model="form.postUrl" class="form-input" type="text" />
        </div>
        <div class="form-item">
          <label class="form-label">{{ t("comments.editModal.content") }}</label>
          <textarea v-model="form.contentText" class="form-input" rows="4"></textarea>
        </div>
        <div class="form-item">
          <label class="form-label">{{ t("comments.editModal.status") }}</label>
          <select v-model="form.status" class="form-input">
            <option value="approved">{{ t("comments.statusFilter.approved") }}</option>
            <option value="pending">{{ t("comments.statusFilter.pending") }}</option>
            <option value="rejected">{{ t("comments.statusFilter.rejected") }}</option>
          </select>
        </div>
        <div class="form-item">
          <label class="form-label">{{ t("comments.editModal.priority") }}</label>
          <input
            v-model.number="form.priority"
            class="form-input"
            type="number"
            min="1"
          />
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-btn secondary" type="button" @click="handleClose">
          {{ t("comments.editModal.cancel") }}
        </button>
        <button
          class="modal-btn primary"
          type="button"
          :disabled="saving"
          @click="handleSubmit"
        >
          <span v-if="saving">{{ t("comments.editModal.saving") }}</span>
          <span v-else>{{ t("comments.editModal.save") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface EditForm {
  id: number;
  name: string;
  email: string;
  url: string;
  postSlug: string;
  postUrl: string;
  contentText: string;
  status: string;
  priority: number;
}

defineProps<{
  visible: boolean;
  form: EditForm | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit"): void;
}>();

function handleClose() {
  emit("close");
}

function handleSubmit() {
  emit("submit");
}
</script>

<style scoped lang="less">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  z-index: 2000;
}

.modal {
  margin: 0;
  background-color: var(--bg-card);
  border-radius: 0;
  box-shadow: var(--shadow-card);
  width: 100%;
  max-width: 600px;
  padding: 20px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transform: translateX(0);
  animation: drawer-in 0.2s ease-out;
  overflow-y: auto;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.modal-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.modal-btn.primary {
  background-color: var(--primary-color);
  color: var(--text-inverse);
}

.modal-btn.secondary {
  background-color: var(--bg-sider);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.modal-btn:hover {
  opacity: 0.9;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.form-input {
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px rgba(9, 105, 218, 0.2);
}
</style>
