<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const leaderboard = ref([])
const loading = ref(true)

const LEAGUE_NAMES = [
  'جوجه‌قلم', 'کلمه‌ساز', 'جمله‌پرداز', 'پاراگراف‌نویس', 'فصل‌ساز',
  'داستان‌سرا', 'رمان‌نویس', 'افسانه‌پرداز', 'استاد قلم', 'اسطورهٔ نویسندگی'
]

const activeDays = computed(() => userStore.profile?.active_days_count || 0)
const currentLevel = computed(() => Math.min(10, Math.floor(activeDays.value / 7) + 1))
const currentLeagueName = computed(() => LEAGUE_NAMES[currentLevel.value - 1])
const daysToNext = computed(() => currentLevel.value >= 10 ? 0 : (7 - (activeDays.value % 7)))
const discountPercent = computed(() => Math.min(9, (currentLevel.value - 1) * 1))

onMounted(async () => {
  loading.value = true
  leaderboard.value = await userStore.fetchLeaderboard()
  loading.value = false
})
</script>

<template>
  <div class="league-desk">
    <div class="league-header">
      <h2>🏆 لیگ و تالار افتخارات نویسندگان</h2>
      <p class="sub">با هر هفته استمرار در نوشتن، یک پله در نردبان لیگ‌ها بالا بروید.</p>
    </div>

    <!-- کارت سطح فعلی کاربر -->
    <div class="my-league-banner">
      <div class="league-badge">
        <span class="level-tag">لیگ سطح {{ currentLevel }} از ۱۰</span>
        <h3 class="league-title">«{{ currentLeagueName }}»</h3>
        <p class="days-hint">{{ daysToNext }} روز فعالیت تا ارتقا به لیگ بعدی</p>
      </div>

      <div class="discount-pill">
        <span class="disc-num">{{ discountPercent }}٪ تخفیف</span>
        <span class="disc-lbl">تخفیف اشتراک پرمیوم نویسندگی</span>
      </div>
    </div>

    <div class="league-grid">
      <!-- نردبان ۱۰ لیگ -->
      <div class="ladder-card">
        <h3>نردبان ۱۰ گانه لیگ‌ها</h3>
        <div class="ladder-list">
          <div 
            v-for="(name, idx) in LEAGUE_NAMES" 
            :key="idx" 
            class="ladder-row"
            :class="{ active: (idx + 1) === currentLevel }"
          >
            <span class="ladder-num">{{ idx + 1 }}</span>
            <span class="ladder-name">{{ name }}</span>
            <span v-if="(idx + 1) === currentLevel" class="current-tag">لیگ شما</span>
          </div>
        </div>
      </div>

      <!-- جدول رده‌بندی لیدربورد -->
      <div class="leaderboard-card">
        <h3>جدول برترین نویسندگان</h3>
        <div v-if="loading" class="empty-text">در حال دریافت جدول...</div>
        <div v-else-if="leaderboard.length === 0" class="empty-text">هنوز رکوردی ثبت نشده است.</div>
        <div v-else class="lb-list">
          <div 
            v-for="(user, i) in leaderboard" 
            :key="i" 
            class="lb-row"
            :class="{ is_me: user.name === userStore.profile?.display_name }"
          >
            <span class="lb-rank">{{ i + 1 }}</span>
            <span class="lb-username">{{ user.name }}</span>
            <span class="lb-score">{{ user.points }} امتیاز</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.league-desk { direction: rtl; }
.league-header { margin-bottom: 20px; }
h2 { margin: 0 0 4px; font-size: 22px; }
.sub { color: #5F6E58; font-size: 13px; margin: 0; }

.my-league-banner {
  background: linear-gradient(135deg, #FFFDF6 0%, #EAE3C6 100%);
  border: 1.5px solid #B9862D;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.level-tag {
  font-size: 12px;
  color: #5F6E58;
  font-weight: 700;
}

.league-title {
  font-size: 24px;
  font-weight: 900;
  color: #B9862D;
  margin: 4px 0;
}

.days-hint {
  font-size: 13px;
  color: #1E3A2C;
  margin: 0;
}

.discount-pill {
  background: #3F7D53;
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  text-align: center;
}

.disc-num {
  display: block;
  font-size: 18px;
  font-weight: 900;
}

.disc-lbl {
  font-size: 11px;
  opacity: 0.9;
}

.league-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .league-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.ladder-card, .leaderboard-card {
  background: #FFFDF6;
  border: 1.5px solid #DED5AC;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(30, 58, 44, 0.04);
}

.ladder-card h3, .leaderboard-card h3 {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 16px;
  color: #1E3A2C;
  border-bottom: 1px solid #DED5AC;
  padding-bottom: 10px;
}

.ladder-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 6px;
  background: #FBF8EC;
  border: 1px solid #DED5AC;
}

.ladder-row.active {
  background: #EAE3C6;
  border-color: #B9862D;
  box-shadow: 0 2px 8px rgba(185, 134, 45, 0.15);
}

.ladder-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #DED5AC;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: #1E3A2C;
}

.ladder-name { flex: 1; font-weight: 700; font-size: 14px; }
.current-tag {
  background: #B9862D;
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 700;
}

.lb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: #FBF8EC;
  border: 1px solid #DED5AC;
}

.lb-row.is_me {
  border-color: #B9862D;
  background: #EAE3C6;
}

.lb-rank {
  width: 24px;
  font-weight: 800;
  color: #B9862D;
}

.lb-username { flex: 1; font-weight: 700; font-size: 14px; margin: 0 10px; }
.lb-score { font-weight: 800; color: #3F7D53; font-size: 14px; }
.empty-text { text-align: center; color: #5F6E58; padding: 20px; font-size: 13px; }
</style>