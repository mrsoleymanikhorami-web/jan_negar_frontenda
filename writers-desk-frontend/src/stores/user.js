import { defineStore } from 'pinia'
import api from '../api'

export const useUserStore = defineStore('user', {
state: () => ({
    profile: null,
    stories: [],
    activeStory: null,
    activeChapter: null,
    communityStats: { active_streaks_count: 0, total_writers: 0 }, // 👈 اضافه شد
    isAuthenticated: !!localStorage.getItem('access_token'),
  }),

  actions: {
    // ۱. متد ثبت‌نام واقعی
    async register(username, password, displayName) {
      const res = await api.post('/accounts/register/', {
        username: username,
        password: password,
        display_name: displayName,
      })
      this.setAuthData(res.data)
    },

    // ۲. متد ورود واقعی به سیستم
    async login(username, password) {
      const res = await api.post('/accounts/login/', {
        username: username,
        password: password,
      })
      this.setAuthData(res.data)
    },

    // ۳. ذخیره توکن‌ها و واکشی اطلاعات
    setAuthData(data) {
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      this.isAuthenticated = true
      this.fetchProfile()
      this.fetchStories()
    },

    // ۴. خروج از حساب
    logout() {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      this.isAuthenticated = false
      this.profile = null
      this.stories = []
      this.activeStory = null
      this.activeChapter = null
    },

    // ۵. دریافت اطلاعات پروفایل
    async fetchProfile() {
      try {
        const res = await api.get('/accounts/profile/')
        this.profile = res.data
      } catch (err) {
        if (err.response && err.response.status === 401) {
          this.logout()
        }
      }
    },

    // ۶. دریافت پروژه‌ها و فصل‌ها
    async fetchStories() {
      try {
        const res = await api.get('/writer/stories/')
        this.stories = res.data
        if (this.stories.length > 0) {
          this.setActiveStory(this.stories[0])
        } else {
          // اگر هنوز داستانی وجود ندارد، اولین داستان ساخته شود
          await this.createStory('اولین رمان من')
        }
      } catch (err) {
        console.error('خطا در دریافت داستان‌ها:', err)
      }
    },

    // ۷. ساخت داستان جدید
    async createStory(title) {
      const res = await api.post('/writer/stories/', { title })
      this.stories.unshift(res.data)
      this.setActiveStory(res.data)
    },

    setActiveStory(story) {
      this.activeStory = story
      if (story && story.chapters && story.chapters.length > 0) {
        this.activeChapter = story.chapters[0]
      }
    },

    setActiveChapter(chapter) {
      this.activeChapter = chapter
    },

    // ۸. ثبت پیشرفت و دریافت کلمات و امتیازات
    async saveProgress(content) {
      if (!this.activeChapter) return null

      const res = await api.post('/writer/save-progress/', {
        chapter_id: this.activeChapter.id,
        content: content,
      })

      if (this.profile) {
        this.profile.points = res.data.total_points
        this.profile.streak = res.data.streak
      }
      this.activeChapter.word_count = res.data.word_count
      this.activeChapter.content = content

      return res.data
    },

    // ۹. متدهای میز پیرنگ
    async addPlotItem(chapterId, text) {
      const res = await api.post('/writer/plot-items/', {
        chapter: chapterId,
        text: text,
      })
      if (this.activeChapter && this.activeChapter.id === chapterId) {
        if (!this.activeChapter.plot_items) this.activeChapter.plot_items = []
        this.activeChapter.plot_items.push(res.data)
      }
      return res.data
    },

    async togglePlotItem(itemId, isDone) {
      const res = await api.patch(`/writer/plot-items/${itemId}/`, {
        is_done: isDone,
      })
      if (this.activeChapter && this.activeChapter.plot_items) {
        const item = this.activeChapter.plot_items.find(i => i.id === itemId)
        if (item) item.is_done = isDone
      }
      return res.data
    },

    async deletePlotItem(itemId) {
      await api.delete(`/writer/plot-items/${itemId}/`)
      if (this.activeChapter && this.activeChapter.plot_items) {
        this.activeChapter.plot_items = this.activeChapter.plot_items.filter(i => i.id !== itemId)
      }
    },

    // ۱۰. متدهای میز شخصیت‌ها
    async fetchCharacters(storyId) {
      const res = await api.get('/writer/characters/')
      return res.data.filter(c => c.story === storyId)
    },

    async createCharacter(storyId, name) {
      const res = await api.post('/writer/characters/', {
        story: storyId,
        name: name,
      })
      return res.data
    },

    async updateCharacterField(fieldId, value) {
      const res = await api.patch(`/writer/character-fields/${fieldId}/`, {
        value: value,
      })
      return res.data
    },

    async addCustomCharacterField(characterId, category, label) {
      const res = await api.post('/writer/character-fields/', {
        character: characterId,
        category: category,
        label: label,
        value: '',
      })
      return res.data
    },

    async deleteCharacter(characterId) {
      await api.delete(`/writer/characters/${characterId}/`)
    },
    async fetchHighlights() {
      const res = await api.get('/writer/highlights/')
      return res.data
    },

    async createHighlight(storyId, snippet, note) {
      const res = await api.post('/writer/highlights/', {
        story: storyId,
        snippet: snippet,
        note: note,
      })
      return res.data
    },

    async fetchDailyHistory() {
      const res = await api.get('/writer/daily-history/')
      return res.data
    },

    async fetchLeaderboard() {
      const res = await api.get('/writer/leaderboard/')
      return res.data
    },

        async fetchHighlights() {
      const res = await api.get('/writer/highlights/')
      return res.data
    },

    // ذخیره هایلایت جدید با متن، یادداشت و شناسه فصل/داستان
    async createHighlight(storyId, chapterId, snippet, note) {
      const res = await api.post('/writer/highlights/', {
        story: storyId,
        chapter: chapterId,
        snippet: snippet,
        note: note,
      })
      return res.data
    },

        async fetchRewriteRounds(storyId) {
      if (!storyId) return []
      // ارسال مستقیم شناسه داستان به سرور جهت جلوگیری از خطای مقایسه رشته و عدد
      const res = await api.get(`/writer/rewrite-rounds/?story=${storyId}`)
      return res.data
    },

    async createRewriteRound(storyId, title = '') {
      const res = await api.post('/writer/rewrite-rounds/', {
        story: storyId,
        title: title,
      })
      return res.data
    },

    async updateRewriteStatus(statusId, data) {
      const res = await api.patch(`/writer/rewrite-statuses/${statusId}/`, data)
      return res.data
    },

        async fetchCommunityStats() {
      try {
        const res = await api.get('/writer/community-stats/')
        this.communityStats = res.data
        return res.data
      } catch (err) {
        console.error('خطا در دریافت آمار جامعه نویسندگان:', err)
        return { active_streaks_count: 0, total_writers: 0 }
      }
    },

    // تغییر هدف روزانه کاربر
    async updateDailyGoal(newGoal) {
      const res = await api.patch('/accounts/profile/', {
        daily_goal: newGoal
      })
      if (this.profile) {
        this.profile.daily_goal = res.data.daily_goal
      }
      return res.data
    },
  }
})