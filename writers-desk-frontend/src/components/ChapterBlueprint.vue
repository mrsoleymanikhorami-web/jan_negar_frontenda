<script setup>
import { ref, watch } from 'vue'
import api from '../api'

const props = defineProps({
  chapter: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['updated'])

// وضعیت باز/بسته بودن پنل‌ها
const isOpen = ref(false)
const showSubGoals = ref(false) // هر دو فیلد فیزیکی و ذهنی با هم باز و بسته می‌شوند
const showSceneBox = ref(false)

const form = ref({
  primary_goal: props.chapter.primary_goal || 'both',
  reader_physical_state: props.chapter.reader_physical_state || '',
  reader_mental_state: props.chapter.reader_mental_state || '',
  scene_location: props.chapter.scene_location || '',
  scene_time: props.chapter.scene_time || '',
  scene_mood: props.chapter.scene_mood || '',
  scene_characters: props.chapter.scene_characters || '',
  scene_background: props.chapter.scene_background || ''
})

watch(() => props.chapter, (newCh) => {
  form.value = {
    primary_goal: newCh.primary_goal || 'both',
    reader_physical_state: newCh.reader_physical_state || '',
    reader_mental_state: newCh.reader_mental_state || '',
    scene_location: newCh.scene_location || '',
    scene_time: newCh.scene_time || '',
    scene_mood: newCh.scene_mood || '',
    scene_characters: newCh.scene_characters || '',
    scene_background: newCh.scene_background || ''
  }
}, { deep: true })

const saveBlueprint = async () => {
  try {
    const res = await api.patch(`/writer/chapters/${props.chapter.id}/`, form.value)
    emit('updated', res.data)
  } catch (err) {
    console.error('خطا در ذخیره شناسنامه فصل:', err)
  }
}
</script>

<template>
  <div class="blueprint-card">
    <div class="blueprint-header" @click="isOpen = !isOpen">
      <div class="header-title">
        <span class="icon">📋</span>
        <b>معماری و شناسنامهٔ {{ chapter.title }}</b>
        <span class="goal-pill">
          {{ form.primary_goal === 'plot' ? 'هدف: پیرنگ' : form.primary_goal === 'character' ? 'هدف: شخصیت' : 'هدف: پیرنگ و شخصیت' }}
        </span>
      </div>
      <button type="button" class="toggle-arrow">{{ isOpen ? 'بستن ▴' : 'تنظیم مشخصات صحنه ▾' }}</button>
    </div>

    <div v-if="isOpen" class="blueprint-body">
      <!-- ۱. انتخاب هدف اصلی -->
      <div class="blueprint-row">
        <label class="row-label">🎯 هدف اصلی این فصل:</label>
        <div class="pill-selector">
          <button 
            type="button"
            :class="['choice-btn', { active: form.primary_goal === 'plot' }]" 
            @click="form.primary_goal = 'plot'; saveBlueprint()"
          >
            🧩 پیشبرد پیرنگ
          </button>
          <button 
            type="button"
            :class="['choice-btn', { active: form.primary_goal === 'character' }]" 
            @click="form.primary_goal = 'character'; saveBlueprint()"
          >
            🎭 توسعهٔ شخصیت
          </button>
          <button 
            type="button"
            :class="['choice-btn', { active: form.primary_goal === 'both' }]" 
            @click="form.primary_goal = 'both'; saveBlueprint()"
          >
            🌟 هردو
          </button>
        </div>
      </div>

      <!-- ۲. اهداف دوگانه خواننده (کاملاً متقارن، هماهنگ و بازشونده با هم) -->
      <div class="unified-accordion-box">
        <div class="accordion-bar" @click="showSubGoals = !showSubGoals">
          <div class="bar-title">
            <span class="bar-icon">⚡🧠</span>
            <b>اهداف فرعی خواننده (واکنش فیزیکی و ذهنی)</b>
          </div>
          <span class="arrow-indicator">{{ showSubGoals ? 'بستن ▴' : 'مشاهده و ویرایش ▾' }}</span>
        </div>

        <div v-if="showSubGoals" class="accordion-content-grid">
          <!-- ستون راست: حالت فیزیکی -->
          <div class="sync-input-field">
            <label>⚡ حالت فیزیکی مورد انتظار از خواننده:</label>
            <input 
              v-model="form.reader_physical_state" 
              type="text" 
              placeholder="مثلاً: حبس نفس، افزایش ضربان قلب، لرزش، آرامش عمیق..." 
              @blur="saveBlueprint"
              @keydown.enter="saveBlueprint"
            />
          </div>

          <!-- ستون چپ: حالت ذهنی -->
          <div class="sync-input-field">
            <label>🧠 حالت ذهنی و احساسی خواننده:</label>
            <input 
              v-model="form.reader_mental_state" 
              type="text" 
              placeholder="مثلاً: شک و سوءظن، کنجکاوی، شوک، همذات‌پنداری عمیق..." 
              @blur="saveBlueprint"
              @keydown.enter="saveBlueprint"
            />
          </div>
        </div>
      </div>

      <!-- ۳. مختصات ۵ گانه صحنه -->
      <div class="unified-accordion-box">
        <div class="accordion-bar" @click="showSceneBox = !showSceneBox">
          <div class="bar-title">
            <span class="bar-icon">🎬</span>
            <b>مختصات ۵ گانه صحنه (مکان، زمان، حس‌وحال، کاراکترها، بک‌گراند)</b>
          </div>
          <span class="arrow-indicator">{{ showSceneBox ? 'بستن ▴' : 'مشاهده و ویرایش ▾' }}</span>
        </div>

        <div v-if="showSceneBox" class="dimensions-grid">
          <div class="dim-field">
            <label>📍 مکان صحنه:</label>
            <input v-model="form.scene_location" type="text" placeholder="مثلاً: زیرزمین عمارت قدیمی" @blur="saveBlueprint" />
          </div>

          <div class="dim-field">
            <label>⏳ زمان و ساعت:</label>
            <input v-model="form.scene_time" type="text" placeholder="مثلاً: نیمه‌شب بارانی پاییز" @blur="saveBlueprint" />
          </div>

          <div class="dim-field">
            <label>🕯 حس و حال (اتمسفر):</label>
            <input v-model="form.scene_mood" type="text" placeholder="مثلاً: سرد، سنگین، معماگونه" @blur="saveBlueprint" />
          </div>

          <div class="dim-field">
            <label>👥 کاراکترهای حاضر:</label>
            <input v-model="form.scene_characters" type="text" placeholder="مثلاً: سهراب، نگهبان شب" @blur="saveBlueprint" />
          </div>

          <div class="dim-field full-width">
            <label>📜 بک‌گراند و پیش‌زمینه رویدادها:</label>
            <textarea v-model="form.scene_background" rows="2" placeholder="اتفاقاتی که قبل از این لحظه افتاده و روی صحنه اثر دارد..." @blur="saveBlueprint"></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blueprint-card {
  background-color: #FFFDF6;
  border: 1.5px solid #DED5AC;
  border-radius: 12px;
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(30, 58, 44, 0.03);
}

.blueprint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  background-color: #EAE3C6;
  cursor: pointer;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #1E3A2C;
}

.goal-pill {
  font-size: 11px;
  background-color: #FFFDF6;
  padding: 3px 12px;
  border-radius: 12px;
  color: #B9862D;
  font-weight: 700;
  border: 1px solid #DED5AC;
}

.toggle-arrow {
  background: transparent;
  font-size: 12px;
  font-weight: 700;
  color: #5F6E58;
}

.blueprint-body {
  padding: 16px;
  border-top: 1px solid #DED5AC;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.blueprint-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.row-label {
  font-size: 13px;
  font-weight: 700;
  color: #1E3A2C;
}

.pill-selector {
  display: flex;
  gap: 6px;
}

.choice-btn {
  background-color: #EAE3C6;
  border: 1px solid #DED5AC;
  color: #5F6E58;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.choice-btn.active {
  background-color: #B9862D;
  color: white;
  border-color: #B9862D;
}

/* پنل‌های آکاردئونی یکپارچه و هماهنگ */
.unified-accordion-box {
  border: 1px solid #DED5AC;
  border-radius: 10px;
  background-color: #FBF8EC;
  overflow: hidden;
}

.accordion-bar {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #1E3A2C;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #F4E8C1;
}

.bar-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.arrow-indicator {
  font-size: 12px;
  color: #5F6E58;
}

.accordion-content-grid {
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  background-color: #FFFFFF;
}

@media (min-width: 640px) {
  .accordion-content-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.sync-input-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sync-input-field label {
  font-size: 12px;
  font-weight: 700;
  color: #1E3A2C;
}

.sync-input-field input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #DED5AC;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: #FFFDF6;
}

.sync-input-field input:focus {
  border-color: #B9862D;
}

.dimensions-grid {
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background-color: #FFFFFF;
}

.dim-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dim-field.full-width {
  grid-column: 1 / -1;
}

.dim-field label {
  font-size: 11px;
  font-weight: 700;
  color: #5F6E58;
}

.dim-field input, .dim-field textarea {
  padding: 8px 10px;
  border: 1px solid #DED5AC;
  border-radius: 8px;
  font-size: 12px;
  outline: none;
  font-family: inherit;
  background: #FFFDF6;
}
</style>