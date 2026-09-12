<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const emit = defineEmits(['jump'])

const dailyHistory = ref([])
const highlights = ref([])
const bookmarks = ref([])
const todayWords = ref(0)

// هدف روزانه شخصی کاربر
const userGoal = computed(() => {
  return userStore.profile?.daily_goal || 300
})

const progressPercent = computed(() => {
  return Math.min(100, Math.round((todayWords.value / userGoal.value) * 100))
})

const ringOffset = computed(() => {
  const r = 48
  const c = 2 * Math.PI * r
  const pct = Math.min(1, todayWords.value / userGoal.value)
  return c - (pct * c)
})

// آرایه نام روزهای هفته در ایران (شنبه تا جمعه)
const iranWeekDays = [
  { short: 'ش', name: 'شنبه' },
  { short: 'ی', name: 'یکشنبه' },
  { short: 'د', name: 'دوشنبه' },
  { short: 'س', name: 'سه‌شنبه' },
  { short: 'چ', name: 'چهارشنبه' },
  { short: 'پ', name: 'پنج‌شنبه' },
  { short: 'ج', name: 'جمعه' }
]

// محاسبه دقیق ۷ روز هفتهٔ جاری (شروع از شنبه تا جمعه)
const currentWeekDays = computed(() => {
  const now = new Date()
  // در جاوااسکریپت: 0=یکشنبه، 1=دوشنبه، ...، 6=شنبه
  const jsDay = now.getDay()
  // تعداد روزهای گذشته از آخرین شنبه (شنبه=0، یکشنبه=1، ...، جمعه=6)
  const daysSinceSaturday = (jsDay + 1) % 7

  const saturday = new Date(now)
  saturday.setDate(now.getDate() - daysSinceSaturday)
  saturday.setHours(0, 0, 0, 0)

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(saturday)
    d.setDate(saturday.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    
    // کلمات ثبت شده در دیتابیس برای این تاریخ
    const match = dailyHistory.value.find(h => h.day === dateStr)
    const words = match ? match.words : 0

    const todayStr = now.toISOString().slice(0, 10)
    const isToday = (dateStr === todayStr)

    days.push({
      dateStr,
      label: iranWeekDays[i].short,
      fullName: iranWeekDays[i].name,
      words: words,
      isDone: words >= userGoal.value,
      isToday: isToday
    })
  }
  return days
})

onMounted(async () => {
  dailyHistory.value = await userStore.fetchDailyHistory()
  highlights.value = await userStore.fetchHighlights()
  bookmarks.value = await userStore.fetchBookmarks()
  
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayRecord = dailyHistory.value.find(h => h.day === todayStr)
  todayWords.value = todayRecord ? todayRecord.words : 0
})

const handleChangeGoal = async () => {
  const input = prompt('هدف روزانه خود را بر حسب تعداد کلمه وارد کنید:', userGoal.value)
  if (!input) return
  const num = parseInt(input)
  if (isNaN(num) || num < 20) {
    alert('لطفاً عددی معتبر (حداقل ۲۰ کلمه) وارد کنید.')
    return
  }
  await userStore.updateDailyGoal(num)
}

const jumpTo = (storyId, chapterId) => {
  emit('jump', storyId, chapterId)
}
</script>

<template>
  <div class="dashboard-desk">
    <div class="dash-grid">
      <!-- کارت اصلی پیشرفت و استریک -->
      <div class="dash-card">
        <h3>🔥 پیشرفت و استریک امروز</h3>
        
        <!-- بخش هیرو استریک -->
        <div class="streak-hero-clean">
          <div class="ring-box">
            <svg viewBox="0 0 120 120" width="110" height="110">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#DED5AC" stroke-width="10"/>
              <circle 
                cx="60" cy="60" r="48" 
                fill="none" 
                stroke="#B9862D" 
                stroke-width="10"
                stroke-linecap="round" 
                stroke-dasharray="301.59" 
                :stroke-dashoffset="ringOffset"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="66" text-anchor="middle" fill="#1E3A2C" font-size="20" font-weight="900" font-family="Vazirmatn">
                {{ progressPercent }}٪
              </text>
            </svg>
          </div>

          <div class="streak-details">
            <div class="flame-title">{{ userStore.profile?.streak || 0 }} روز استریک</div>
            <p class="flame-desc">
              با نوشتن یا طراحی پیرنگ و شخصیت‌ها، به هدف <b>{{ userGoal }} کلمه‌ای</b> امروز برس تا شعله روشن بماند!
            </p>
          </div>
        </div>

        <!-- تقویم هفتگی استاندارد ایران (شنبه تا جمعه) -->
        <div class="week-calendar-section">
          <div class="calendar-title">روزهای هفتهٔ جاری (شنبه تا جمعه):</div>
          <div class="week-strip">
            <div 
              v-for="(day, idx) in currentWeekDays" 
              :key="idx" 
              class="week-cell"
              :class="{ done: day.isDone, today: day.isToday }"
              :title="`${day.fullName}: ${day.words} کلمه`"
            >
              <span class="day-letter">{{ day.label }}</span>
              <span v-if="day.isDone" class="check-dot">✓</span>
            </div>
          </div>
        </div>

        <!-- کارت‌های سه‌گانه آمار با چیدمان عریض، جادار و زیبا -->
        <div class="stats-cards-grid">
          <div class="stat-box">
            <div class="stat-top">
              <span class="stat-num">{{ todayWords }}</span>
              <span class="stat-icon">✍️</span>
            </div>
            <span class="stat-sub">پیشرفت کلمات امروز</span>
          </div>

          <div class="stat-box goal-card" @click="handleChangeGoal" title="برای تغییر کلیک کنید">
            <div class="stat-top">
              <span class="stat-num gold-text">{{ userGoal }}</span>
              <span class="stat-icon">✏️</span>
            </div>
            <span class="stat-sub">هدف روزانه (تغییر)</span>
          </div>

          <div class="stat-box">
            <div class="stat-top">
              <span class="stat-num">{{ userStore.profile?.points || 0 }}</span>
              <span class="stat-icon">🏆</span>
            </div>
            <span class="stat-sub">مجموع امتیازات</span>
          </div>
        </div>
      </div>

      <!-- کارت بوکمارک‌ها و تاریخچه -->
      <div class="dash-card">
        <h3>🔖 بوکمارک‌های اخیر داستان</h3>
        <div v-if="bookmarks.length === 0" class="empty-text">هنوز بوکمارکی ثبت نشده است.</div>
        <div v-else class="bm-list">
          <div 
            v-for="b in bookmarks.slice(0, 4)" 
            :key="b.id" 
            class="bm-row"
            @click="jumpTo(b.story, b.chapter)"
          >
            <span class="bm-icon">🔖</span>
            <span class="bm-text">{{ b.snippet }}</span>
            <span class="bm-story">{{ b.story_title }}</span>
          </div>
        </div>

        <h3 style="margin-top: 24px;">📅 تاریخچه فعالیت‌های روزانه</h3>
        <div v-if="dailyHistory.length === 0" class="empty-text">هنوز آماری ثبت نشده است.</div>
        <div v-else class="history-list">
          <div v-for="h in dailyHistory.slice(0, 5)" :key="h.id" class="history-row">
            <span class="history-date">{{ h.day }}</span>
            <span class="history-words">{{ h.words }} کلمه</span>
          </div>
        </div>
      </div>
    </div>

    <!-- کارت کامل هایلایت‌ها -->
    <div class="dash-card full-card">
      <div class="card-title-row">
        <h3>🖍 هایلایت‌ها و یادداشت‌های برگزیده</h3>
        <span class="hl-count">{{ highlights.length }} بخش هایلایت‌شده</span>
      </div>

      <div v-if="highlights.length === 0" class="empty-text">
        هنوز متنی را هایلایت نکرده‌اید. متنی را در ویرایشگر با ماوس انتخاب کرده و دکمه «🖍 هایلایت» را بزنید.
      </div>

      <div v-else class="hl-grid">
        <div 
          v-for="hl in highlights" 
          :key="hl.id" 
          class="hl-card clickable"
          @click="jumpTo(hl.story, hl.chapter)"
        >
          <div class="hl-snippet">«{{ hl.snippet }}»</div>
          <div v-if="hl.note" class="hl-note">📝 {{ hl.note }}</div>
          <div class="hl-meta-row">
            <span class="hl-story">📖 {{ hl.story_title }} {{ hl.chapter_title ? `(${hl.chapter_title})` : '' }}</span>
            <span class="jump-link">برو به متن ↗</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-desk { direction: rtl; }
.dash-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

@media (min-width: 768px) {
  .dash-grid {
    grid-template-columns: 1.15fr 0.85fr;
  }
}

.dash-card {
  background: #FFFDF6;
  border: 1.5px solid #DED5AC;
  padding: 22px;
  border-radius: 18px;
  box-shadow: 0 4px 14px rgba(30, 58, 44, 0.04);
}

.full-card { margin-top: 20px; }

.dash-card h3 {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 16px;
  color: #1E3A2C;
  border-bottom: 1px solid #DED5AC;
  padding-bottom: 10px;
}

/* هیرو استریک */
.streak-hero-clean {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.ring-box {
  flex-shrink: 0;
}

.flame-title {
  font-size: 26px;
  font-weight: 900;
  color: #B9862D;
  margin-bottom: 4px;
}

.flame-desc {
  font-size: 13px;
  color: #5F6E58;
  line-height: 1.6;
  margin: 0;
}

.flame-desc b {
  color: #1E3A2C;
}

/* تقویم هفته خورشیدی */
.week-calendar-section {
  margin-bottom: 22px;
}

.calendar-title {
  font-size: 12px;
  font-weight: 700;
  color: #5F6E58;
  margin-bottom: 8px;
}

.week-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.week-cell {
  height: 42px;
  border-radius: 10px;
  background-color: #EAE3C6;
  border: 1px solid #DED5AC;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: #1E3A2C;
  position: relative;
  transition: all 0.2s ease;
}

.week-cell.done {
  background-color: #3F7D53;
  border-color: #3F7D53;
  color: #FFFFFF;
}

.week-cell.today {
  border: 2px solid #B9862D;
  box-shadow: 0 0 0 2px rgba(185, 134, 45, 0.2);
}

.check-dot {
  font-size: 9px;
  line-height: 1;
  margin-top: 2px;
}

/* آمار سه‌گانه افقی و شکیل */
.stats-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-box {
  background-color: #EAE3C6;
  border: 1px solid #DED5AC;
  padding: 14px 12px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: right;
  transition: all 0.2s ease;
}

.stat-box.goal-card {
  cursor: pointer;
  border: 1.5px dashed #B9862D;
}

.stat-box.goal-card:hover {
  background-color: #F4E8C1;
  transform: translateY(-2px);
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.stat-num {
  font-size: 22px;
  font-weight: 900;
  color: #1E3A2C;
  line-height: 1;
}

.stat-num.gold-text {
  color: #B9862D;
}

.stat-icon {
  font-size: 18px;
}

.stat-sub {
  font-size: 11px;
  font-weight: 700;
  color: #5F6E58;
}

/* لیست تاریخچه و بوکمارک‌ها */
.history-list, .bm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-row, .bm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background-color: #FBF8EC;
  border: 1px solid #DED5AC;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

.bm-row {
  cursor: pointer;
  transition: all 0.2s;
}

.bm-row:hover {
  background-color: #EAE3C6;
}

.bm-text {
  flex: 1;
  margin: 0 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #1E3A2C;
}

.bm-story {
  font-size: 11px;
  color: #B9862D;
  font-weight: 700;
}

.history-words {
  color: #3F7D53;
  font-weight: 800;
}

/* هایلایت‌ها */
.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #DED5AC;
  padding-bottom: 10px;
  margin-bottom: 16px;
}

.card-title-row h3 { border: none; margin: 0; padding: 0; }
.hl-count { font-size: 12px; color: #B9862D; font-weight: 800; }

.hl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.hl-card {
  background: #FBF8EC;
  border: 1px solid #DED5AC;
  border-right: 4px solid #B9862D;
  padding: 14px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.hl-card.clickable { cursor: pointer; }
.hl-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}

.hl-snippet { font-size: 14px; font-weight: 700; color: #1E3A2C; margin-bottom: 6px; }
.hl-note { font-size: 12px; color: #5F6E58; margin-bottom: 8px; }
.hl-meta-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
.hl-story { color: #B9862D; font-weight: 700; }
.jump-link { color: #3F7D53; font-weight: 700; }
.empty-text { text-align: center; color: #5F6E58; padding: 24px; font-size: 13px; }
</style>