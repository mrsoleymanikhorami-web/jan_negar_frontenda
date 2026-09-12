<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const rounds = ref([])
const activeDraftId = ref(null)
const isCreating = ref(false)
const saveToast = ref('')

const loadRounds = async () => {
  if (!userStore.activeStory) return
  rounds.value = await userStore.fetchRewriteRounds(userStore.activeStory.id)
  
  // اگر دوری وجود دارد، پیش‌نویس اولین فصل آن را خودکار باز کن تا کاربر فوراً ببیند
  if (rounds.value.length > 0 && !activeDraftId.value) {
    const firstRound = rounds.value[0]
    if (firstRound.statuses && firstRound.statuses.length > 0) {
      activeDraftId.value = firstRound.statuses[0].id
    }
  }
}

onMounted(loadRounds)
watch(() => userStore.activeStory, loadRounds)

// ساخت دور بازنویسی جدید با کپی خودکار متن تمام فصل‌ها
const handleCreateRound = async () => {
  if (!userStore.activeStory) {
    alert('لطفاً ابتدا از بالای صفحه یک داستان را انتخاب کنید.')
    return
  }

  isCreating.value = true
  try {
    const newRound = await userStore.createRewriteRound(userStore.activeStory.id)
    await loadRounds()
    
    // باز کردن خودکار دور جدید و اولین فصل آن
    if (newRound.statuses && newRound.statuses.length > 0) {
      activeDraftId.value = newRound.statuses[0].id
    }
    saveToast.value = `«${newRound.title}» ساخته شد و متن فصل‌ها برای بازنویسی کپی گردید ✓`
    setTimeout(() => { saveToast.value = '' }, 4000)
  } catch (err) {
    console.error('خطا در ساخت دور بازنویسی:', err)
    alert('خطا در ساخت دور بازنویسی. لطفاً بررسی کنید سرور جنگو فعال باشد.')
  } finally {
    isCreating.value = false
  }
}

const toggleDraft = (statusId) => {
  activeDraftId.value = activeDraftId.value === statusId ? null : statusId
}

// ذخیره تغییرات پیش‌نویس بازنویسی
const handleSaveDraft = async (status) => {
  try {
    const updated = await userStore.updateRewriteStatus(status.id, {
      content: status.content
    })
    status.word_count = updated.word_count
    saveToast.value = `پیش‌نویس بازنویسی ${status.chapter_title} ذخیره شد ✓ (تعداد کلمات: ${updated.word_count})`
    setTimeout(() => { saveToast.value = '' }, 3500)
  } catch (err) {
    alert('خطا در ذخیره پیش‌نویس بازنویسی')
  }
}

const handleToggleDone = async (status) => {
  await userStore.updateRewriteStatus(status.id, {
    is_done: status.is_done
  })
}

// ریست پیش‌نویس به متن اصلی فصل
const handleResetToOriginal = async (status) => {
  if (!confirm('آیا مطمئن هستید؟ متن این پیش‌نویس با آخرین نسخه متن اصلی فصل جایگزین خواهد شد.')) return
  status.content = status.original_content || ''
  await handleSaveDraft(status)
}

const getDoneCount = (statuses) => {
  if (!statuses) return 0
  return statuses.filter(s => s.is_done).length
}

// حذف تگ‌های HTML برای نمایش متن خالص در مقایسه
const stripHtml = (html) => {
  if (!html) return 'متن اصلی این فصل خالی است.'
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}
</script>

<template>
  <div class="rewrite-desk">
    <div class="desk-header">
      <div>
        <h2>🔁 میز بازنویسی و ویرایش رمان</h2>
        <p class="sub">دورهای بازنویسی مجزا بسازید. تغییرات شما در اینجا هیچ آسیبی به متن اصلی رمان نمی‌زند.</p>
      </div>

      <!-- دکمه سبز ساخت دور جدید -->
      <button 
        type="button" 
        @click="handleCreateRound" 
        class="btn-create-round"
        :disabled="isCreating"
      >
        {{ isCreating ? 'در حال ساخت و کپی متن فصل‌ها...' : '+ دور بازنویسی جدید ✍️' }}
      </button>
    </div>

    <!-- پیام موفقیت -->
    <div v-if="saveToast" class="toast-msg">{{ saveToast }}</div>

    <div v-if="!userStore.activeStory" class="empty-card">
      <p>ابتدا از نوار بالای صفحه یک رمان را انتخاب کنید.</p>
    </div>

    <div v-else-if="rounds.length === 0" class="empty-card">
      <h3>هنوز دور بازنویسی نساخته‌اید!</h3>
      <p>روی دکمه سبز <b>«+ دور بازنویسی جدید ✍️»</b> کلیک کنید تا متن رمان برای بازبینی کپی شود.</p>
    </div>

    <!-- لیست دورهای بازنویسی -->
    <div v-else class="rounds-list">
      <div v-for="round in rounds" :key="round.id" class="round-card">
        <div class="round-summary">
          <span class="round-title">📑 {{ round.title }}</span>
          <span class="progress-pill">
            {{ getDoneCount(round.statuses) }} از {{ round.statuses?.length || 0 }} فصل بازبینی شده
          </span>
        </div>

        <div class="round-body">
          <div v-for="st in round.statuses" :key="st.id" class="chapter-rewrite-item">
            <!-- ردیف عنوان فصل -->
            <div class="item-header" :class="{ completed: st.is_done }">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="st.is_done" 
                  @change="handleToggleDone(st)" 
                />
                <span class="checkbox-custom"></span>
              </label>

              <span class="ch-name" @click="toggleDraft(st.id)">
                {{ st.chapter_title }}
              </span>

              <span class="meta-tag">
                {{ st.word_count }} کلمه
              </span>

              <button type="button" @click="toggleDraft(st.id)" class="btn-toggle-editor">
                {{ activeDraftId === st.id ? 'بستن پیش‌نویس ▴' : 'ویرایش پیش‌نویس ▾' }}
              </button>
            </div>

            <!-- محیط بازنویسی و مقایسه دو ستونه -->
            <div v-if="activeDraftId === st.id" class="draft-workspace">
              <div class="comparison-grid">
                <!-- ستون ۱: متن اصلی فصل (فقط جهت مشاهده و مقایسه) -->
                <div class="original-panel">
                  <div class="panel-tag">📖 متن اصلی فصل (دست‌نخورده):</div>
                  <div class="original-text-content">
                    {{ stripHtml(st.original_content) }}
                  </div>
                </div>

                <!-- ستون ۲: متن بازنویسی (قابل ویرایش مستقل) -->
                <div class="draft-panel">
                  <div class="panel-tag editable-tag">✍️ نسخهٔ بازنویسی این فصل (ویرایش آزاد):</div>
                  <textarea 
                    v-model="st.content" 
                    rows="12" 
                    class="draft-textarea"
                    placeholder="متن بازنویسی را اینجا ویرایش کنید..."
                  ></textarea>

                  <div class="draft-actions">
                    <button type="button" @click="handleSaveDraft(st)" class="btn-save-draft">
                      ذخیره این بازنویسی 💾
                    </button>
                    <button type="button" @click="handleResetToOriginal(st)" class="btn-reset-draft">
                      بازنشانی از متن اصلی
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rewrite-desk { direction: rtl; }
.desk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 14px;
}
h2 { margin: 0 0 4px; font-size: 22px; font-weight: 800; color: #1E3A2C; }
.sub { color: #5F6E58; font-size: 13px; margin: 0; }

.btn-create-round {
  background-color: #3F7D53;
  color: white;
  padding: 11px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(63, 125, 83, 0.25);
  cursor: pointer;
}

.btn-create-round:hover {
  background-color: #24503A;
}

.toast-msg {
  background-color: #F4E8C1;
  color: #1E3A2C;
  border: 1px solid #B9862D;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 16px;
}

.empty-card {
  background-color: #FFFDF6;
  padding: 40px;
  border-radius: 14px;
  text-align: center;
  border: 1.5px dashed #DED5AC;
  color: #5F6E58;
}

.empty-card h3 { color: #1E3A2C; margin-bottom: 8px; }

.round-card {
  background-color: #FFFDF6;
  border: 1.5px solid #DED5AC;
  border-radius: 14px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(30, 58, 44, 0.04);
}

.round-summary {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #EAE3C6;
  border-bottom: 1.5px solid #DED5AC;
}

.round-title { font-size: 16px; font-weight: 800; color: #1E3A2C; }

.progress-pill {
  font-size: 12px;
  background-color: #FFFDF6;
  padding: 4px 14px;
  border-radius: 20px;
  color: #B9862D;
  font-weight: 800;
  border: 1px solid #DED5AC;
}

.round-body {
  padding: 16px 20px;
}

.chapter-rewrite-item {
  border-bottom: 1px solid #EAE3C6;
  padding: 14px 0;
}

.chapter-rewrite-item:last-child {
  border-bottom: none;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-header.completed .ch-name {
  text-decoration: line-through;
  color: #888;
}

.ch-name {
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  flex: 1;
}

.ch-name:hover {
  color: #B9862D;
}

.meta-tag {
  font-size: 12px;
  color: #5F6E58;
  background-color: #EAE3C6;
  padding: 3px 10px;
  border-radius: 8px;
}

.btn-toggle-editor {
  background: #FFFDF6;
  border: 1px solid #DED5AC;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  color: #1E3A2C;
}

.draft-workspace {
  margin-top: 14px;
  padding: 16px;
  background-color: #FBF8EC;
  border-radius: 12px;
  border: 1.5px solid #DED5AC;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 820px) {
  .comparison-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.original-panel, .draft-panel {
  display: flex;
  flex-direction: column;
}

.panel-tag {
  font-size: 12px;
  font-weight: 800;
  color: #5F6E58;
  margin-bottom: 8px;
}

.editable-tag {
  color: #B9862D;
}

.original-text-content {
  background-color: #EAE3C6;
  border: 1px solid #DED5AC;
  border-radius: 8px;
  padding: 14px;
  font-size: 14px;
  line-height: 1.9;
  color: #5F6E58;
  max-height: 280px;
  overflow-y: auto;
}

.draft-textarea {
  width: 100%;
  padding: 14px;
  border-radius: 8px;
  border: 1.5px solid #B9862D;
  background-color: #FFFFFF;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.9;
  color: #1E3A2C;
  resize: vertical;
  outline: none;
}

.draft-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.btn-save-draft {
  background-color: #3F7D53;
  color: white;
  padding: 9px 18px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.btn-save-draft:hover {
  background-color: #24503A;
}

.btn-reset-draft {
  background-color: transparent;
  border: 1px solid #A6462D;
  color: #A6462D;
  padding: 9px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.goal-box {
  cursor: pointer;
  border: 1.5px dashed #B9862D;
  transition: all 0.2s ease;
}

.goal-box:hover {
  background-color: #F4E8C1;
  transform: translateY(-2px);
}

</style>