<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from './stores/user'
import Editor from './components/Editor.vue'
import PlotDesk from './components/PlotDesk.vue'
import CharacterDesk from './components/CharacterDesk.vue'
import RewriteDesk from './components/RewriteDesk.vue'
import LeagueDesk from './components/LeagueDesk.vue'
import DashboardDesk from './components/DashboardDesk.vue'
import ChapterBlueprint from './components/ChapterBlueprint.vue'

const userStore = useUserStore()
const activeTab = ref('dash')

// متغیرهای فرم احراز هویت
const isLoginMode = ref(true)
const authUsername = ref('')
const authPassword = ref('')
const authDisplayName = ref('')
const authError = ref('')
const isSubmitting = ref(false)

// متغیرهای ادیتور و داستان
const newStoryTitle = ref('')
const editorContent = ref('')
const saveMessage = ref('')

// متغیرهای مودال یادداشت هایلایت
const showHighlightModal = ref(false)
const highlightSnippet = ref('')
const highlightNote = ref('')

onMounted(async () => {
  onMounted(async () => {
    // دریافت آمار کاربران فعال
    await userStore.fetchCommunityStats()

    if (userStore.isAuthenticated) {
      await userStore.fetchProfile()
      await userStore.fetchStories()
      if (userStore.activeChapter) {
        editorContent.value = userStore.activeChapter.content || ''
      }
    }
  })

  if (userStore.isAuthenticated) {
    await userStore.fetchProfile()
    await userStore.fetchStories()
    if (userStore.activeChapter) {
      editorContent.value = userStore.activeChapter.content || ''
    }
  }
})

const handleAuth = async () => {
  authError.value = ''
  isSubmitting.value = true
  try {
    if (isLoginMode.value) {
      await userStore.login(authUsername.value.trim(), authPassword.value)
    } else {
      if (!authDisplayName.value.trim()) {
        authError.value = 'لطفاً نام نویسندگی خود را وارد کنید.'
        isSubmitting.value = false
        return
      }
      await userStore.register(authUsername.value.trim(), authPassword.value, authDisplayName.value.trim())
    }
    if (userStore.activeChapter) {
      editorContent.value = userStore.activeChapter.content || ''
    }
  } catch (err) {
    console.error('خطای ورود یا ثبت‌نام:', err)
    if (!err.response) {
      authError.value = 'ارتباط با سرور جنگو برقرار نشد. لطفاً بررسی کنید سرور روشن باشد.'
    } else if (err.response.data) {
      authError.value = err.response.data.error || err.response.data.username?.[0] || 'اطلاعات وارد شده نامعتبر است.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCreateStory = async () => {
  if (!newStoryTitle.value.trim()) return
  await userStore.createStory(newStoryTitle.value.trim())
  newStoryTitle.value = ''
  if (userStore.activeChapter) {
    editorContent.value = userStore.activeChapter.content || ''
  }
}

const handleSave = async () => {
  saveMessage.value = 'در حال ذخیره‌سازی...'
  try {
    const result = await userStore.saveProgress(editorContent.value)

    let bonusText = ''
    if (result.points_gained === 10) {
      bonusText = '🎉 ۱۰+ امتیاز (۵ فعالیت + ۵ تکمیل هدف روزانه)'
    } else if (result.points_gained === 5) {
      bonusText = result.goal_completed
        ? '🎯 ۵+ امتیاز پاداش تکمیل هدف روزانه!'
        : '✨ ۵+ امتیاز ثبت فعالیت امروز!'
    }

    saveMessage.value = `ذخیره شد ✓ (${result.word_count} کلمه) ${bonusText}`
    setTimeout(() => { saveMessage.value = '' }, 4500)
  } catch (err) {
    saveMessage.value = 'خطا در ذخیره‌سازی'
  }
}

// رویداد درخواست هایلایت از سوی ویرایشگر
const onOpenHighlightModal = (snippet) => {
  highlightSnippet.value = snippet
  highlightNote.value = ''
  showHighlightModal.value = true
}

// ذخیره قطعی هایلایت به همراه یادداشت در بک‌اند جنگو
const saveHighlight = async () => {
  if (!userStore.activeStory) return
  await userStore.createHighlight(
    userStore.activeStory.id,
    userStore.activeChapter ? userStore.activeChapter.id : null,
    highlightSnippet.value,
    highlightNote.value.trim()
  )
  showHighlightModal.value = false
  saveMessage.value = 'هایلایت با یادداشت ذخیره شد ✓'
  setTimeout(() => { saveMessage.value = '' }, 3000)
}

// ذخیره بوکمارک در نقطه جاری
const onAddBookmark = async (snippet) => {
  if (!userStore.activeStory) return
  await userStore.createBookmark(
    userStore.activeStory.id,
    userStore.activeChapter ? userStore.activeChapter.id : null,
    snippet
  )
  saveMessage.value = '🔖 بوکمارک در این نقطه ذخیره شد ✓'
  setTimeout(() => { saveMessage.value = '' }, 3000)
}

// پرش هوشمند از کارت‌های داشبورد به ویرایشگر متن
const handleJumpToHighlight = (storyId, chapterId) => {
  const story = userStore.stories.find(s => s.id === storyId)
  if (story) {
    userStore.setActiveStory(story)
    if (chapterId) {
      const ch = story.chapters?.find(c => c.id === chapterId)
      if (ch) {
        userStore.setActiveChapter(ch)
        editorContent.value = ch.content || ''
      }
    }
  }
  activeTab.value = 'editor'
}
</script>

<template>
  <div class="main-wrapper">
    <!-- مودال ورود و ثبت‌نام -->
    <div v-if="!userStore.isAuthenticated" class="auth-overlay">
      <div class="auth-box">
        <div class="auth-header">
          <div class="auth-logo">🖋️</div>
          <h2 class="auth-title">میزکار نویسنده</h2>
          <p class="auth-subtitle">استودیو اختصاصی خلق داستان و رمان</p>
        </div>

        <div class="auth-toggle">
          <button type="button" :class="['toggle-btn', { active: isLoginMode }]"
            @click="isLoginMode = true; authError = ''">
            ورود به حساب
          </button>
          <button type="button" :class="['toggle-btn', { active: !isLoginMode }]"
            @click="isLoginMode = false; authError = ''">
            عضویت جدید
          </button>
        </div>

        <div v-if="authError" class="auth-error">
          {{ authError }}
        </div>

        <form @submit.prevent="handleAuth" class="auth-form">
          <div v-if="!isLoginMode" class="input-group">
            <label>نام و نام خانوادگی (یا نام مستعار):</label>
            <input v-model="authDisplayName" type="text" placeholder="مثلاً: فاطمه احمدی" required />
          </div>

          <div class="input-group">
            <label>نام کاربری:</label>
            <input v-model="authUsername" type="text" placeholder="مثلاً: fatemeh_writer" dir="ltr" required />
          </div>

          <div class="input-group">
            <label>رمز عبور:</label>
            <input v-model="authPassword" type="password" placeholder="حداقل ۶ کاراکتر" dir="ltr" required />
          </div>

          <button type="submit" class="submit-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'در حال ارتباط...' : (isLoginMode ? 'ورود به میزکار' : 'ثبت‌نام و شروع نوشتن') }}
          </button>
        </form>
      </div>
    </div>

    <!-- میزکار اصلی پس از ورود -->
    <div v-else class="workspace">
      <!-- هدر بالای صفحه -->
      <header class="header-card">
        <div class="user-block">
          <div class="avatar-circle">✍️</div>
          <div>
            <h1 class="user-name">سلام، <span>{{ userStore.profile?.display_name }}</span></h1>

            <!-- نشان زنده جامعه نویسندگان دارای استریک -->
            <div class="community-live-pill">
              <span class="pulse-indicator"></span>
              <span class="community-text">
                <b>{{ userStore.communityStats?.active_streaks_count || 1 }} نویسنده</b> هم‌اکنون با شعلهٔ استریک روشن
                🔥
              </span>
            </div>

            <button @click="userStore.logout()" class="logout-btn">خروج از حساب</button>
          </div>
        </div>

        <div class="stats-block">
          <div class="stat-card">
            <span class="stat-icon">🔥</span>
            <div class="stat-texts">
              <span class="stat-value">{{ userStore.profile?.streak || 0 }} روز</span>
              <span class="stat-label">استریک شما</span>
            </div>
          </div>

          <div class="stat-card">
            <span class="stat-icon">🏆</span>
            <div class="stat-texts">
              <span class="stat-value">{{ userStore.profile?.points || 0 }}</span>
              <span class="stat-label">امتیاز کل</span>
            </div>
          </div>
        </div>
      </header>

      <!-- نوار ناوبری ۶ تب اصلی -->
      <nav class="tabs-container">
        <button type="button" :class="['tab-pill', { active: activeTab === 'dash' }]" @click="activeTab = 'dash'">
          📊 میزکار
        </button>
        <button type="button" :class="['tab-pill', { active: activeTab === 'editor' }]" @click="activeTab = 'editor'">
          ✍️ نوشتن
        </button>
        <button type="button" :class="['tab-pill', { active: activeTab === 'plot' }]" @click="activeTab = 'plot'">
          🧩 پیرنگ
        </button>
        <button type="button" :class="['tab-pill', { active: activeTab === 'characters' }]"
          @click="activeTab = 'characters'">
          🎭 شخصیت‌ها
        </button>
        <button type="button" :class="['tab-pill', { active: activeTab === 'rewrite' }]" @click="activeTab = 'rewrite'">
          🔁 بازنویسی
        </button>
        <button type="button" :class="['tab-pill', { active: activeTab === 'league' }]" @click="activeTab = 'league'">
          🏆 لیگ
        </button>
      </nav>

      <!-- نوار انتخاب و ساخت داستان (در تب‌های مرتبط) -->
      <section v-if="activeTab !== 'league'" class="project-bar">
        <div class="story-selector">
          <label>داستان فعال:</label>
          <select :value="userStore.activeStory?.id"
            @change="e => userStore.setActiveStory(userStore.stories.find(s => s.id == e.target.value))">
            <option v-for="story in userStore.stories" :key="story.id" :value="story.id">
              📖 {{ story.title }} ({{ story.last_word_count }} کلمه)
            </option>
          </select>
        </div>

        <div class="story-creator">
          <input v-model="newStoryTitle" type="text" placeholder="عنوان رمان یا داستان جدید..."
            @keydown.enter="handleCreateStory" />
          <button type="button" @click="handleCreateStory" class="btn-new-story">+ پروژه جدید</button>
        </div>
      </section>

      <!-- محتوای متناظر با هر تب -->
      <div v-if="activeTab === 'dash'">
        <DashboardDesk @jump="handleJumpToHighlight" />
      </div>

      <div v-else-if="activeTab === 'editor'">

        <section v-if="userStore.activeStory" class="chapters-wrapper">
          <span class="chapters-title">فصل‌های رمان:</span>
          <div class="chapters-scroll">
            <button v-for="ch in userStore.activeStory.chapters" :key="ch.id" type="button"
              :class="['chapter-button', { active: userStore.activeChapter?.id === ch.id }]"
              @click="userStore.setActiveChapter(ch); editorContent = ch.content || ''">
              {{ ch.title }}
              <span class="badge">{{ ch.word_count }} کلمه</span>
            </button>
          </div>
        </section>

        <ChapterBlueprint v-if="userStore.activeChapter" :chapter="userStore.activeChapter" />

        <main class="editor-wrap">
          <div v-if="saveMessage" class="toast-save">{{ saveMessage }}</div>
          <Editor v-model="editorContent" @save="handleSave" @requestHighlight="onOpenHighlightModal"
            @requestBookmark="onAddBookmark" />
        </main>

      </div>

      <div v-else-if="activeTab === 'plot'">
        <PlotDesk />
      </div>

      <div v-else-if="activeTab === 'characters'">
        <CharacterDesk />
      </div>

      <div v-else-if="activeTab === 'rewrite'">
        <RewriteDesk />
      </div>

      <div v-else-if="activeTab === 'league'">
        <LeagueDesk />
      </div>
    </div>

    <!-- مودال اختصاصی ثبت دلیل هایلایت -->
    <div v-if="showHighlightModal" class="auth-overlay">
      <div class="auth-box">
        <h3 class="modal-heading">🖍 چرا این بخش رو هایلایت کردی؟</h3>
        <p class="snippet-preview">«{{ highlightSnippet }}»</p>

        <div class="input-group">
          <label>توضیح یا یادداشت نویسندگی:</label>
          <textarea v-model="highlightNote" rows="3"
            placeholder="مثلاً: این جمله باید در بازنویسی بهتر شود، یا سرنخ مهم داستان است..."
            class="note-textarea"></textarea>
        </div>

        <div class="modal-btn-row">
          <button type="button" @click="saveHighlight" class="btn-save-modal">ذخیره هایلایت</button>
          <button type="button" @click="showHighlightModal = false" class="btn-cancel-modal">انصراف</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-heading {
  font-size: 18px;
  font-weight: 800;
  color: #1E3A2C;
  margin-bottom: 8px;
}

.snippet-preview {
  font-size: 13px;
  font-weight: 700;
  color: #B9862D;
  background: #F4E8C1;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 14px;
  line-height: 1.6;
}

.note-textarea {
  width: 100%;
  padding: 10px;
  border: 1.5px solid #DED5AC;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  outline: none;
  resize: vertical;
  background-color: #FFFFFF;
}

.note-textarea:focus {
  border-color: #B9862D;
}

.modal-btn-row {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.btn-save-modal {
  flex: 1;
  background: #3F7D53;
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-weight: 700;
}

.btn-save-modal:hover {
  background: #24503A;
}

.btn-cancel-modal {
  background: transparent;
  border: 1px solid #DED5AC;
  color: #5F6E58;
  padding: 10px 16px;
  border-radius: 8px;
}

.btn-cancel-modal:hover {
  background: #EAE3C6;
}
</style>