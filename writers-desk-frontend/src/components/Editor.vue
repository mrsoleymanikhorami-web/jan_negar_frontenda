<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import { computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'requestHighlight', 'requestBookmark'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Highlight.configure({ multicolor: true }),
  ],
  onUpdate: () => {
    emit('update:modelValue', editor.value.getHTML())
  },
})

watch(() => props.modelValue, (newContent) => {
  if (editor.value && editor.value.getHTML() !== newContent) {
    editor.value.commands.setContent(newContent, false)
  }
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// تشخیص اینکه آیا متنی توسط کاربر انتخاب (Select) شده است یا خیر
const hasSelection = computed(() => {
  if (!editor.value) return false
  const { from, to } = editor.value.state.selection
  return to > from
})

// تابع اجرای هایلایت
const triggerHighlight = () => {
  if (!editor.value) return
  const { from, to } = editor.value.state.selection
  const selectedText = editor.value.state.doc.textBetween(from, to, ' ')

  if (!selectedText || !selectedText.trim()) {
    alert('ابتدا بخشی از متن را با ماوس انتخاب (سلکت) کنید، سپس دکمه «هایلایت» را بزنید.')
    return
  }

  // ۱. رنگ‌آمیزی فوری متن انتخاب‌شده در ویرایشگر با رنگ طلایی
  editor.value.chain().focus().toggleHighlight({ color: '#F4E8C1' }).run()

  // ۲. باز کردن مودال ثبت دلیل در App.vue
  emit('requestHighlight', selectedText.trim())
}

// تابع ایجاد بوکمارک
const triggerBookmark = () => {
  if (!editor.value) return
  const { from, to } = editor.value.state.selection
  let snippet = editor.value.state.doc.textBetween(from, to, ' ').trim()
  if (!snippet) {
    snippet = 'نشانه در این نقطه از داستان'
  }
  emit('requestBookmark', snippet.slice(0, 70))
}

const wordCount = computed(() => {
  if (!editor.value) return 0
  const text = editor.value.getText()
  const words = text.trim().length ? text.trim().split(/\s+/).filter(Boolean) : []
  return words.length
})

const pageCount = computed(() => {
  return Math.max(1, Math.ceil(wordCount.value / 250))
})
</script>

<template>
  <div class="editor-box">
    <!-- تولبار کامل ویرایشگر -->
    <div v-if="editor" class="editor-toolbar">
      <!-- ابزارهای فرمت متن -->
      <div class="tools-left">
        <button 
          type="button"
          @click="editor.chain().focus().toggleBold().run()" 
          :class="['tool-btn', { active: editor.isActive('bold') }]"
          title="پررنگ (Bold)"
        >
          <b>B</b>
        </button>

        <button 
          type="button"
          @click="editor.chain().focus().toggleItalic().run()" 
          :class="['tool-btn', { active: editor.isActive('italic') }]"
          title="کج (Italic)"
        >
          <i>I</i>
        </button>

        <button 
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" 
          :class="['tool-btn', { active: editor.isActive('heading', { level: 1 }) }]"
          title="تیتر اصلی (H1)"
        >
          H1
        </button>

        <button 
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" 
          :class="['tool-btn', { active: editor.isActive('heading', { level: 2 }) }]"
          title="تیتر فرعی (H2)"
        >
          H2
        </button>

        <div class="divider"></div>

        <!-- دکمه هایلایت (وقتی متن انتخاب شود روشن می‌شود) -->
        <button 
          type="button"
          @click="triggerHighlight" 
          :class="['highlight-action-btn', { 'has-selection': hasSelection }]"
          title="هایلایت کردن متن انتخاب‌شده"
        >
          🖍 هایلایت
        </button>

        <!-- دکمه بوکمارک -->
        <button 
          type="button"
          @click="triggerBookmark" 
          class="bookmark-action-btn"
          title="نشانه‌گذاری این بخش"
        >
          🔖 بوکمارک
        </button>
      </div>

      <!-- دکمه ذخیره پیشرفت -->
      <div class="tools-right">
        <button type="button" @click="$emit('save')" class="save-action-btn">
          ثبت پیشرفت امروز ✍️
        </button>
      </div>
    </div>

    <!-- کانتینر تایپ متن -->
    <editor-content :editor="editor" class="editor-content-area" />

    <!-- فوتر آمار کلمات و صفحات -->
    <footer class="editor-meta-footer">
      <span><b>{{ wordCount }}</b> کلمه · <b>{{ pageCount }}</b> صفحه (تقریبی)</span>
      <span class="meta-hint">متن را انتخاب کنید و دکمه <b>«🖍 هایلایت»</b> را بزنید.</span>
    </footer>
  </div>
</template>

<style scoped>
.editor-box {
  background-color: #FFFDF6;
  border: 1.5px solid #DED5AC;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(30, 58, 44, 0.04);
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background-color: #EAE3C6;
  border-bottom: 1.5px solid #DED5AC;
}

.tools-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tools-right {
  display: flex;
  align-items: center;
}

.divider {
  width: 1.5px;
  height: 22px;
  background-color: #DED5AC;
  margin: 0 4px;
}

.tool-btn {
  background-color: #FFFDF6;
  border: 1px solid #DED5AC;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 700;
  color: #1E3A2C;
  font-size: 13px;
}

.tool-btn.active {
  background-color: #B9862D;
  color: #FFFFFF;
  border-color: #B9862D;
}

/* دکمه اختصاصی هایلایت */
.highlight-action-btn {
  background-color: #FFFDF6;
  border: 1.5px solid #B9862D;
  color: #B9862D;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 13px;
  transition: all 0.2s ease;
}

.highlight-action-btn:hover,
.highlight-action-btn.has-selection {
  background-color: #B9862D;
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(185, 134, 45, 0.35);
}

/* دکمه اختصاصی بوکمارک */
.bookmark-action-btn {
  background-color: #FFFDF6;
  border: 1px solid #DED5AC;
  color: #1E3A2C;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
}

.bookmark-action-btn:hover {
  background-color: #EAE3C6;
}

.save-action-btn {
  background-color: #3F7D53;
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
}

.save-action-btn:hover {
  background-color: #24503A;
}

@media (max-width: 600px) {
  .tools-right {
    width: 100%;
  }
  .save-action-btn {
    width: 100%;
    margin-top: 4px;
  }
}

:deep(.editor-content-area .ProseMirror) {
  min-height: 380px;
  padding: 24px;
  outline: none;
  font-size: 18px;
  line-height: 2;
  direction: rtl;
  text-align: right;
  color: #1E3A2C;
  font-family: 'Vazirmatn', Tahoma, sans-serif;
}

:deep(.editor-content-area mark) {
  background-color: #F4E8C1;
  color: #1E3A2C;
  border-radius: 3px;
  padding: 2px 4px;
  border-bottom: 2px solid #B9862D;
}

.editor-meta-footer {
  display: flex;
  justify-content: space-between;
  padding: 10px 18px;
  background-color: #FFFDF6;
  border-top: 1px solid #DED5AC;
  font-size: 12px;
  color: #5F6E58;
}

.editor-meta-footer b {
  color: #B9862D;
}

/* در بخش <style scoped> فایل src/components/Editor.vue این بخش را جایگزین کنید: */

:deep(.editor-content-area) {
  max-height: 480px; /* 👈 محدود کردن ارتفاع جهت جلوگیری از کش آمدن صفحه */
  overflow-y: auto;   /* 👈 فعال‌سازی اسکرول اختصاصی */
  scrollbar-width: thin;
  scrollbar-color: #DED5AC #FFFDF6;
}

:deep(.editor-content-area::-webkit-scrollbar) {
  width: 6px;
}

:deep(.editor-content-area::-webkit-scrollbar-track) {
  background: #FFFDF6;
}

:deep(.editor-content-area::-webkit-scrollbar-thumb) {
  background-color: #DED5AC;
  border-radius: 6px;
}

:deep(.editor-content-area .ProseMirror) {
  min-height: 380px;
  padding: 24px;
  outline: none;
  font-size: 18px;
  line-height: 2;
  direction: rtl;
  text-align: right;
  color: #1E3A2C;
  font-family: 'Vazirmatn', Tahoma, sans-serif;
}
</style>