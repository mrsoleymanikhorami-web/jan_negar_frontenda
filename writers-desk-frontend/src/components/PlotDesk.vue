<script setup>
import { ref } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const newItemText = ref({})

const handleAddItem = async (chapterId) => {
  const text = newItemText.value[chapterId]?.trim()
  if (!text) return

  await userStore.addPlotItem(chapterId, text)
  newItemText.value[chapterId] = ''
}

const handleToggle = async (itemId, isDone) => {
  await userStore.togglePlotItem(itemId, isDone)
}

const handleDelete = async (itemId) => {
  await userStore.deletePlotItem(itemId)
}

const getCompletedCount = (items) => {
  if (!items) return 0
  return items.filter(i => i.is_done).length
}
</script>

<template>
  <div class="plot-desk">
    <h2>🧩 میز پیرنگ داستان</h2>
    <p class="sub">اتفاقات داستانت رو فصل به فصل برنامه‌ریزی کن و تیک بزن.</p>

    <div v-if="!userStore.activeStory" class="empty-card">
      <p>ابتدا یک پروژه را انتخاب کنید.</p>
    </div>

    <div v-else class="chapters-grid">
      <details 
        v-for="ch in userStore.activeStory.chapters" 
        :key="ch.id" 
        class="chapter-card"
        :open="ch.id === userStore.activeChapter?.id"
      >
        <summary class="chapter-summary">
          <span class="title">{{ ch.title }}</span>
          <span class="badge">
            {{ getCompletedCount(ch.plot_items) }} / {{ ch.plot_items?.length || 0 }} چک‌لیست
          </span>
        </summary>

        <div class="chapter-body">
          <!-- لیست آیتم‌های پیرنگ -->
          <div class="items-list">
            <div 
              v-for="item in ch.plot_items" 
              :key="item.id" 
              class="plot-item"
              :class="{ done: item.is_done }"
            >
              <input 
                type="checkbox" 
                :checked="item.is_done" 
                @change="e => handleToggle(item.id, e.target.checked)"
              />
              <span class="text">{{ item.text }}</span>
              <button @click="handleDelete(item.id)" class="del-btn">✕</button>
            </div>
          </div>

          <!-- فرم افزودن آیتم جدید -->
          <div class="add-box">
            <input 
              v-model="newItemText[ch.id]" 
              type="text" 
              placeholder="مثلاً: قهرمان با استاد آشنا می‌شود..." 
              @keydown.enter="handleAddItem(ch.id)"
            />
            <button @click="handleAddItem(ch.id)" class="add-btn">+ افزودن</button>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.plot-desk {
  direction: rtl;
}

h2 { margin: 0 0 4px; font-size: 22px; }
.sub { color: #5F6E58; font-size: 13px; margin-bottom: 20px; }

.empty-card {
  background: #FFFDF6;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  border: 1px dashed #DED5AC;
}

.chapter-card {
  background: #FFFDF6;
  border: 1px solid #DED5AC;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.chapter-summary {
  padding: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #EAE3C6;
}

.badge {
  font-size: 11px;
  background: #FBF8EC;
  padding: 4px 10px;
  border-radius: 20px;
  color: #B9862D;
}

.chapter-body {
  padding: 16px;
  border-top: 1px solid #DED5AC;
}

.plot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #F2EDE2;
}

.plot-item.done .text {
  text-decoration: line-through;
  color: #888;
}

.plot-item .text { flex: 1; font-size: 14px; }

.del-btn {
  background: none;
  border: none;
  color: #A6462D;
  cursor: pointer;
  font-weight: bold;
}

.add-box {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.add-box input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #DED5AC;
  border-radius: 8px;
  font-family: inherit;
}

.add-btn {
  background: #3F7D53;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}
</style>