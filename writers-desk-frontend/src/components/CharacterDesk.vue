<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const characters = ref([])
const newCharName = ref('')
const loading = ref(false)

const loadCharacters = async () => {
  if (!userStore.activeStory) return
  loading.value = true
  characters.value = await userStore.fetchCharacters(userStore.activeStory.id)
  loading.value = false
}

onMounted(loadCharacters)
watch(() => userStore.activeStory, loadCharacters)

const handleCreateCharacter = async () => {
  if (!newCharName.value.trim() || !userStore.activeStory) return
  const newChar = await userStore.createCharacter(userStore.activeStory.id, newCharName.value.trim())
  characters.value.push(newChar)
  newCharName.value = ''
}

const handleFieldBlur = async (field) => {
  await userStore.updateCharacterField(field.id, field.value)
}

const handleAddCustomField = async (character, category) => {
  const label = prompt('عنوان ویژگی جدید را بنویسید (مثلاً: لهجه، رنگ لباس، اتومبیل):')
  if (!label || !label.trim()) return

  const newField = await userStore.addCustomCharacterField(character.id, category, label.trim())
  if (!character.fields) character.fields = []
  character.fields.push(newField)
}

const handleDeleteCharacter = async (characterId) => {
  if (!confirm('آیا از حذف این شخصیت اطمینان دارید؟')) return
  await userStore.deleteCharacter(characterId)
  characters.value = characters.value.filter(c => c.id !== characterId)
}

const getCompletionRate = (fields) => {
  if (!fields || fields.length === 0) return 0
  const filled = fields.filter(f => f.value && f.value.trim().length > 0).length
  return Math.round((filled / fields.length) * 100)
}
</script>

<template>
  <div class="character-desk">
    <div class="desk-header">
      <div>
        <h2>🎭 میز شخصیت‌پردازی</h2>
        <p class="sub">شناسنامهٔ عمیق و ویژگی‌های ظاهری و روانی کاراکترهایت را بساز.</p>
      </div>

      <!-- ساخت کاراکتر جدید -->
      <div class="add-char-box">
        <input 
          v-model="newCharName" 
          type="text" 
          placeholder="نام شخصیت جدید..." 
          @keydown.enter="handleCreateCharacter"
        />
        <button @click="handleCreateCharacter" class="btn-create">+ ساخت شخصیت</button>
      </div>
    </div>

    <div v-if="!userStore.activeStory" class="empty-card">
      <p>ابتدا یک پروژه را انتخاب کنید.</p>
    </div>

    <div v-else-if="characters.length === 0 && !loading" class="empty-card">
      <p>هنوز شخصیتی برای این داستان نساخته‌اید. نام اولین شخصیت را در بالا وارد کنید!</p>
    </div>

    <!-- لیست کارت‌های کاراکترها -->
    <div v-else class="chars-grid">
      <details v-for="char in characters" :key="char.id" class="char-card" open>
        <summary class="char-summary">
          <span class="char-name">👤 {{ char.name }}</span>
          <div class="summary-actions">
            <span class="progress-badge">
              {{ getCompletionRate(char.fields) }}٪ تکمیل شده
            </span>
            <button @click.stop="handleDeleteCharacter(char.id)" class="del-char-btn">حذف</button>
          </div>
        </summary>

        <div class="char-body">
          <!-- بخش ۱: ویژگی‌های ظاهری -->
          <div class="section-group">
            <div class="group-header">
              <h4>🎨 ویژگی‌های ظاهری و فیزیکی</h4>
              <button @click="handleAddCustomField(char, 'appearance')" class="btn-add-field">+ ویژگی ظاهری</button>
            </div>
            
            <div class="fields-grid">
              <div 
                v-for="field in char.fields?.filter(f => f.category === 'appearance')" 
                :key="field.id" 
                class="field-row"
              >
                <label>{{ field.label }}:</label>
                <textarea 
                  v-model="field.value" 
                  @blur="handleFieldBlur(field)" 
                  placeholder="اینجا بنویسید..."
                  rows="1"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- بخش ۲: ویژگی‌های اخلاقی و روانی -->
          <div class="section-group">
            <div class="group-header">
              <h4>🧠 ویژگی‌های روانی، اخلاقی و اهداف</h4>
              <button @click="handleAddCustomField(char, 'personality')" class="btn-add-field">+ ویژگی اخلاقی</button>
            </div>

            <div class="fields-grid">
              <div 
                v-for="field in char.fields?.filter(f => f.category === 'personality')" 
                :key="field.id" 
                class="field-row"
              >
                <label>{{ field.label }}:</label>
                <textarea 
                  v-model="field.value" 
                  @blur="handleFieldBlur(field)" 
                  placeholder="اینجا بنویسید..."
                  rows="1"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<style scoped>
.character-desk {
  direction: rtl;
}

.desk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

h2 { margin: 0 0 4px; font-size: 22px; }
.sub { color: #5F6E58; font-size: 13px; margin: 0; }

.add-char-box {
  display: flex;
  gap: 8px;
}

.add-char-box input {
  padding: 8px 12px;
  border: 1px solid #DED5AC;
  border-radius: 8px;
  background: #FFFDF6;
  font-family: inherit;
}

.btn-create {
  background: #3F7D53;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-family: inherit;
}

.empty-card {
  background: #FFFDF6;
  padding: 40px;
  border-radius: 14px;
  text-align: center;
  border: 1px dashed #DED5AC;
}

.char-card {
  background: #FFFDF6;
  border: 1px solid #DED5AC;
  border-radius: 14px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.char-summary {
  padding: 16px 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #EAE3C6;
}

.char-name { font-size: 16px; }

.summary-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-badge {
  font-size: 12px;
  background: #FBF8EC;
  padding: 4px 12px;
  border-radius: 20px;
  color: #B9862D;
  font-weight: bold;
}

.del-char-btn {
  background: none;
  border: 1px solid #A6462D;
  color: #A6462D;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
}

.char-body {
  padding: 20px;
  border-top: 1px solid #DED5AC;
}

.section-group {
  margin-bottom: 24px;
}

.section-group:last-child {
  margin-bottom: 0;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #DED5AC;
  padding-bottom: 8px;
  margin-bottom: 14px;
}

.group-header h4 {
  margin: 0;
  color: #B9862D;
  font-size: 14px;
}

.btn-add-field {
  background: transparent;
  border: 1px solid #DED5AC;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  color: #5F6E58;
}

.btn-add-field:hover {
  background: #EAE3C6;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px 16px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-row label {
  font-size: 12px;
  color: #5F6E58;
  font-weight: 500;
}

.field-row textarea {
  background: #FBF8EC;
  border: 1px solid #DED5AC;
  border-radius: 8px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
  outline: none;
}

.field-row textarea:focus {
  border-color: #B9862D;
  background: white;
}
</style>