<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'

// Types matching packages/types
interface ExamSession {
  id: string
  examSnapshotId: string
  userId: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED'
  startedAt?: string
  submittedAt?: string
  remainingSeconds?: number
}

interface CandidateQuestion {
  snapshotId: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'PROGRAMMING'
  title: string
  content: Record<string, unknown>
  score: number
  sortOrder: number
  sampleTestCases?: { input: string; expectedOutput: string }[]
  starterCode?: string
  timeLimitMs: number
}

interface CandidatePaper {
  examSnapshotId: string
  title: string
  startTime: string
  endTime: string
  durationMinutes: number
  remainingSeconds: number
  questions: CandidateQuestion[]
}

// State
const currentView = ref<'login' | 'list' | 'exam'>('login')
const examId = ref<number>(1)
const username = ref('')
const password = ref('')
const loginError = ref('')
const loginLoading = ref(false)

const sessions = ref<{ id: number; title: string; status: string }[]>([])
const currentSession = ref<ExamSession | null>(null)
const paper = ref<CandidatePaper | null>(null)
const currentQuestionIndex = ref(0)
const answers = ref<Map<string, Record<string, unknown>>>(new Map())
const submitLoading = ref(false)
const autoSaveStatus = ref<'idle' | 'saving' | 'saved'>('idle')

let timerInterval: number | null = null
let autoSaveInterval: number | null = null

const currentQuestion = computed(() => {
  if (!paper.value || !paper.value.questions.length) return null
  return paper.value.questions[currentQuestionIndex.value]
})

const formattedTime = computed(() => {
  if (!paper.value) return '00:00'
  const secs = paper.value.remainingSeconds
  const mins = Math.floor(secs / 60)
  const secsRem = secs % 60
  return `${String(mins).padStart(2, '0')}:${String(secsRem).padStart(2, '0')}`
})

// Login
async function handleLogin() {
  if (!username.value || !password.value) {
    loginError.value = '请输入用户名和密码'
    return
  }
  loginLoading.value = true
  loginError.value = ''
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
    })
    const data = await res.json()
    if (data.code === 0) {
      localStorage.setItem('token', data.data.token)
      // Fetch user info after login to get user ID
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.data.token}` },
      })
      const meData = await meRes.json()
      if (meData.code === 0) {
        localStorage.setItem('userId', String(meData.data.id))
      }
      loadExamList()
    } else {
      loginError.value = data.message || '登录失败'
    }
  } catch {
    loginError.value = '网络错误'
  } finally {
    loginLoading.value = false
  }
}

async function loadExamList() {
  try {
    const res = await fetch('/api/client/exams', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    const data = await res.json()
    if (data.code === 0) {
      sessions.value = data.data.items || []
    }
  } catch (e) {
    console.error('Failed to load exam list:', e)
  }
  currentView.value = 'list'
}

function selectExam(id: number) {
  examId.value = id
  startExam()
}

async function startExam() {
  const userId = localStorage.getItem('userId')
  if (!userId) return

  try {
    // Start session
    const res = await fetch(`/api/client/exams/${examId.value}/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ device_id: 'desktop-001' }),
    })
    const data = await res.json()
    if (data.code === 0) {
      currentSession.value = data.data
    }

    // Get paper
    const paperRes = await fetch(`/api/client/exams/${examId.value}/paper`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    const paperData = await paperRes.json()
    if (paperData.code === 0) {
      // Map snake_case backend fields to camelCase
      paper.value = {
        examSnapshotId: String(paperData.data.exam_snapshot_id),
        title: paperData.data.title || '',
        startTime: paperData.data.start_time,
        endTime: paperData.data.end_time,
        durationMinutes: paperData.data.duration_minutes,
        remainingSeconds: paperData.data.remaining_seconds,
        questions: (paperData.data.questions || []).map((q: any) => ({
          snapshotId: String(q.snapshot_id),
          type: q.type,
          title: q.title,
          content: q.content || {},
          score: q.score,
          sortOrder: q.sort_order,
          sampleTestCases: (q.sample_test_cases || []).map((tc: any) => ({
            input: tc.input,
            expectedOutput: tc.expected_output,
          })),
          starterCode: q.starter_code,
          timeLimitMs: q.time_limit_ms,
        })),
      }
      currentView.value = 'exam'
      startTimer()
      startAutoSave()
    }
  } catch (e) {
    console.error('Failed to start exam:', e)
  }
}

function startTimer() {
  timerInterval = window.setInterval(() => {
    if (paper.value && paper.value.remainingSeconds > 0) {
      paper.value.remainingSeconds--
    }
  }, 1000)
}

function startAutoSave() {
  autoSaveInterval = window.setInterval(() => {
    saveDraft()
  }, 30000) // every 30 seconds
}

async function saveDraft() {
  if (!paper.value) return
  autoSaveStatus.value = 'saving'
  try {
    await fetch(`/api/client/exams/${examId.value}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ answers: Object.fromEntries(answers.value) }),
    })
    autoSaveStatus.value = 'saved'
    setTimeout(() => { autoSaveStatus.value = 'idle' }, 2000)
  } catch {
    autoSaveStatus.value = 'idle'
  }
}

async function submitExam() {
  if (!confirm('确定要交卷吗？')) return
  submitLoading.value = true
  try {
    await fetch(`/api/client/exams/${examId.value}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    alert('提交成功')
    cleanup()
    currentView.value = 'list'
  } catch {
    alert('提交失败')
  } finally {
    submitLoading.value = false
  }
}

function cleanup() {
  if (timerInterval) clearInterval(timerInterval)
  if (autoSaveInterval) clearInterval(autoSaveInterval)
}

function handleAnswer(questionId: string, answer: Record<string, unknown>) {
  answers.value.set(questionId, answer)
}

function navigateQuestion(index: number) {
  currentQuestionIndex.value = index
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    loadExamList()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <main class="layout">
    <!-- Login View -->
    <div v-if="currentView === 'login'" class="login-panel">
      <div class="login-card">
        <h2>候选人登录</h2>
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" />
        </div>
        <p v-if="loginError" class="error">{{ loginError }}</p>
        <button @click="handleLogin" :disabled="loginLoading" class="btn-primary">
          {{ loginLoading ? '登录中...' : '登录' }}
        </button>
      </div>
    </div>

    <!-- Exam List View -->
    <div v-if="currentView === 'list'" class="list-panel">
      <header class="topbar">
        <div>
          <p class="kicker">Examora Desktop</p>
          <h1>选择考试</h1>
        </div>
        <button @click="currentView = 'login'" class="btn-secondary">退出登录</button>
      </header>
      <div class="exam-grid">
        <div v-for="exam in sessions" :key="exam.id" class="exam-card">
          <h3>{{ exam.title }}</h3>
          <span :class="'status-' + exam.status">{{ exam.status }}</span>
          <button @click="selectExam(exam.id)" class="btn-primary">开始考试</button>
        </div>
      </div>
    </div>

    <!-- Exam View -->
    <div v-if="currentView === 'exam' && paper" class="exam-panel">
      <header class="topbar">
        <div>
          <p class="kicker">Examora Desktop</p>
          <h1>{{ paper.title }}</h1>
        </div>
        <div class="status">
          <span :class="{ warning: paper.remainingSeconds < 300 }">
            Timer: {{ formattedTime }}
          </span>
          <span>Autosave: {{ autoSaveStatus }}</span>
        </div>
      </header>

      <section class="panel">
        <!-- Question Nav -->
        <div class="column">
          <h2>题目导航</h2>
          <div class="question-nav">
            <button
              v-for="(q, index) in paper.questions"
              :key="q.snapshotId"
              :class="{ active: index === currentQuestionIndex, answered: answers.has(q.snapshotId) }"
              @click="navigateQuestion(index)"
            >
              {{ index + 1 }}
            </button>
          </div>
        </div>

        <!-- Question Body -->
        <div class="column wide">
          <div v-if="currentQuestion" class="question-content">
            <div class="question-header">
              <span class="q-type">{{ currentQuestion.type }}</span>
              <span class="q-score">{{ currentQuestion.score }}分</span>
            </div>
            <h3>{{ currentQuestion.title }}</h3>
            <p>{{ JSON.stringify(currentQuestion.content) }}</p>

            <!-- Answer based on type -->
            <div class="answer-area">
              <template v-if="currentQuestion.type === 'SINGLE_CHOICE'">
                <label v-for="(opt, key) in (currentQuestion.content.options as Record<string, string>)" :key="key">
                  <input
                    type="radio"
                    :name="'q-' + currentQuestion.snapshotId"
                    :value="key"
                    @change="handleAnswer(currentQuestion.snapshotId, { selected: key })"
                  />
                  {{ opt }}
                </label>
              </template>
              <template v-else-if="currentQuestion.type === 'PROGRAMMING'">
                <textarea
                  :value="answers.get(currentQuestion.snapshotId)?.code || ''"
                  @input="handleAnswer(currentQuestion.snapshotId, { code: ($event.target as HTMLTextAreaElement).value })"
                  placeholder="请输入代码..."
                  class="code-editor"
                ></textarea>
                <p v-if="currentQuestion.sampleTestCases?.length" class="sample-cases">
                  示例用例：
                  <div v-for="(tc, i) in currentQuestion.sampleTestCases" :key="i">
                    输入: {{ tc.input }} → 输出: {{ tc.expectedOutput }}
                  </div>
                </p>
              </template>
              <template v-else>
                <textarea
                  :value="answers.get(currentQuestion.snapshotId)?.text || ''"
                  @input="handleAnswer(currentQuestion.snapshotId, { text: ($event.target as HTMLTextAreaElement).value })"
                  placeholder="请输入答案..."
                ></textarea>
              </template>
            </div>

            <div class="nav-buttons">
              <button
                @click="navigateQuestion(Math.max(0, currentQuestionIndex - 1))"
                :disabled="currentQuestionIndex === 0"
              >
                上一题
              </button>
              <button
                @click="navigateQuestion(Math.min(paper.questions.length - 1, currentQuestionIndex + 1))"
                :disabled="currentQuestionIndex === paper.questions.length - 1"
              >
                下一题
              </button>
            </div>
          </div>
        </div>

        <!-- Events Panel -->
        <div class="column">
          <h2>操作</h2>
          <button @click="saveDraft" class="btn-secondary">保存草稿</button>
          <button @click="submitExam" :disabled="submitLoading" class="btn-primary">
            {{ submitLoading ? '提交中...' : '交卷' }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, rgba(249, 201, 145, 0.2), transparent 30%),
    linear-gradient(180deg, #f9f4eb 0%, #f0e1cc 100%);
  color: #1d140d;
}

.login-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.login-card {
  background: rgba(255, 251, 245, 0.9);
  padding: 48px;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  min-width: 400px;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(29, 20, 13, 0.2);
  border-radius: 8px;
  font-size: 16px;
}

.error {
  color: #e54;
  margin: 8px 0;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: #1d140d;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 16px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(29, 20, 13, 0.3);
  border-radius: 8px;
  cursor: pointer;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 24px;
}

.kicker {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #7d5d42;
}

h1 { margin: 0; }

.status {
  display: flex;
  gap: 12px;
}

.status span {
  padding: 10px 14px;
  border: 1px solid rgba(29, 20, 13, 0.12);
  border-radius: 18px;
  background: rgba(255, 251, 245, 0.78);
}

.status span.warning {
  color: #e54;
  border-color: #e54;
}

.panel {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  gap: 16px;
}

.column {
  background: rgba(255, 251, 245, 0.78);
  border: 1px solid rgba(29, 20, 13, 0.12);
  border-radius: 18px;
  padding: 18px;
}

.wide { min-height: 500px; }

.question-nav {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.question-nav button {
  aspect-ratio: 1;
  border: 1px solid rgba(29, 20, 13, 0.2);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-weight: 500;
}

.question-nav button.active {
  background: #1d140d;
  color: white;
}

.question-nav button.answered {
  background: #4caf50;
  color: white;
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.q-type {
  background: #7d5d42;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.q-score {
  color: #7d5d42;
  font-weight: 500;
}

.answer-area {
  margin-top: 24px;
}

.answer-area label {
  display: block;
  padding: 12px;
  border: 1px solid rgba(29, 20, 13, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.answer-area textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid rgba(29, 20, 13, 0.2);
  border-radius: 8px;
  font-family: monospace;
  resize: vertical;
}

.code-editor {
  font-family: monospace;
  min-height: 300px;
}

.sample-cases {
  margin-top: 16px;
  padding: 12px;
  background: rgba(125, 93, 66, 0.1);
  border-radius: 8px;
  font-size: 14px;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(29, 20, 13, 0.1);
}

.nav-buttons button {
  padding: 10px 24px;
  border: 1px solid rgba(29, 20, 13, 0.3);
  border-radius: 8px;
  cursor: pointer;
}

.nav-buttons button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.exam-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.exam-card {
  background: rgba(255, 251, 245, 0.9);
  padding: 24px;
  border-radius: 18px;
  border: 1px solid rgba(29, 20, 13, 0.12);
}

.exam-card h3 { margin: 0 0 12px; }

.status-DRAFT { color: gray; }
.status-PUBLISHED { color: green; }
.status-RUNNING { color: blue; }

@media (max-width: 900px) {
  .panel, .topbar {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>