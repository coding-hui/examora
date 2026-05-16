<script setup lang="ts">
import { ApiClient } from '@examora/client';
import type {
  CandidateExamItem,
  CandidatePaper,
  CandidateQuestion,
  ExamSession,
} from '@examora/types';
import { computed, onMounted, onUnmounted, ref } from 'vue';

interface ChoiceOption {
  key: string;
  text: string;
}

const apiClient = new ApiClient({ baseUrl: '' });

// State
const currentView = ref<'login' | 'list' | 'exam'>('login');
const examId = ref<number>(1);
const username = ref('');
const password = ref('');
const loginError = ref('');
const listError = ref('');
const examError = ref('');
const loginLoading = ref(false);

const sessions = ref<CandidateExamItem[]>([]);
const currentSession = ref<ExamSession | null>(null);
const paper = ref<CandidatePaper | null>(null);
const currentQuestionIndex = ref(0);
const answers = ref<Map<string, Record<string, unknown>>>(new Map());
const submitLoading = ref(false);
const autoSaveStatus = ref<'idle' | 'saving' | 'saved'>('idle');
const examActive = ref(false);

let timerInterval: number | null = null;
let autoSaveInterval: number | null = null;

const currentQuestion = computed(() => {
  if (!paper.value?.questions.length) return null;
  return paper.value.questions[currentQuestionIndex.value];
});

const formattedTime = computed(() => {
  if (!paper.value) return '00:00';
  const secs = paper.value.remaining_seconds;
  const mins = Math.floor(secs / 60);
  const secsRem = secs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secsRem).padStart(2, '0')}`;
});

function syncClientTokenFromStorage() {
  const token = localStorage.getItem('token');
  if (token) {
    apiClient.setAccessToken(token);
  } else {
    apiClient.clearAccessToken();
  }
}

// Login
async function handleLogin() {
  if (!username.value || !password.value) {
    loginError.value = '请输入用户名和密码';
    return;
  }
  loginLoading.value = true;
  loginError.value = '';
  try {
    const loginData = await apiClient.authLogin({
      username: username.value,
      password: password.value,
    });
    localStorage.setItem('token', loginData.token);
    const meData = await apiClient.authMe();
    localStorage.setItem('userId', String(meData.id));
    await loadExamList();
  } catch (error) {
    loginError.value = error instanceof Error ? error.message : '网络错误';
  } finally {
    loginLoading.value = false;
  }
}

async function loadExamList() {
  listError.value = '';
  try {
    syncClientTokenFromStorage();
    const data = await apiClient.listAvailableExams();
    sessions.value = data.items || [];
  } catch (error) {
    listError.value =
      error instanceof Error ? error.message : '考试列表加载失败';
  }
  currentView.value = 'list';
}

function selectExam(id: number) {
  examId.value = id;
  currentQuestionIndex.value = 0;
  answers.value.clear();
  examActive.value = false;
  startExam();
}

async function startExam() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  examError.value = '';
  try {
    syncClientTokenFromStorage();
    currentSession.value = await apiClient.startExamSession(examId.value, {
      device_id: 'desktop-001',
    });
    paper.value = await apiClient.getCandidatePaper(examId.value);
    examActive.value = true;
    currentView.value = 'exam';
    startTimer();
    startAutoSave();
  } catch (error) {
    examError.value = error instanceof Error ? error.message : '考试启动失败';
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = window.setInterval(() => {
    if (paper.value && paper.value.remaining_seconds > 0) {
      paper.value.remaining_seconds--;
    }
  }, 1000);
}

function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = window.setInterval(() => {
    saveDraft();
  }, 30000); // every 30 seconds
}

async function saveDraft() {
  if (!paper.value || !examActive.value || submitLoading.value) return;
  autoSaveStatus.value = 'saving';
  try {
    syncClientTokenFromStorage();
    await apiClient.saveAnswers(examId.value, {
      answers: Object.fromEntries(answers.value),
    });
    autoSaveStatus.value = 'saved';
    setTimeout(() => {
      autoSaveStatus.value = 'idle';
    }, 2000);
  } catch {
    autoSaveStatus.value = 'idle';
  }
}

async function submitExam() {
  if (!confirm('确定要交卷吗？')) return;
  submitLoading.value = true;
  try {
    syncClientTokenFromStorage();
    examActive.value = false;
    cleanup();
    await apiClient.submitExam(examId.value);
    alert('提交成功');
    paper.value = null;
    currentSession.value = null;
    answers.value.clear();
    currentView.value = 'list';
  } catch {
    examActive.value = true;
    startTimer();
    startAutoSave();
    alert('提交失败');
  } finally {
    submitLoading.value = false;
  }
}

function cleanup() {
  if (timerInterval) clearInterval(timerInterval);
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  timerInterval = null;
  autoSaveInterval = null;
  autoSaveStatus.value = 'idle';
}

function handleAnswer(questionId: string, answer: Record<string, unknown>) {
  answers.value.set(questionId, answer);
}

function getAnswerString(questionId: string, key: string): string {
  const value = answers.value.get(questionId)?.[key];
  return typeof value === 'string' ? value : '';
}

function getChoiceOptions(question: CandidateQuestion): ChoiceOption[] {
  const options = question.content.options;
  if (Array.isArray(options)) {
    return options
      .map((option, index) => {
        if (typeof option === 'string') {
          return { key: String.fromCharCode(65 + index), text: option };
        }
        const item = option as Record<string, unknown>;
        return {
          key: String(item.key || String.fromCharCode(65 + index)),
          text: String(item.text || ''),
        };
      })
      .filter((option) => option.text);
  }

  if (options && typeof options === 'object') {
    return Object.entries(options as Record<string, unknown>).map(
      ([key, text]) => ({
        key,
        text: String(text),
      }),
    );
  }

  return [];
}

function getQuestionText(question: CandidateQuestion): string {
  return String(question.content.text || '');
}

function isChoiceSelected(questionId: string, key: string): boolean {
  const choices = answers.value.get(questionId)?.choices;
  return Array.isArray(choices) && choices.includes(key);
}

function toggleMultipleChoice(
  questionId: string,
  key: string,
  checked: boolean,
) {
  const current = answers.value.get(questionId)?.choices;
  const choices = Array.isArray(current) ? current.map(String) : [];
  const next = checked
    ? Array.from(new Set([...choices, key]))
    : choices.filter((choice) => choice !== key);
  handleAnswer(questionId, { choices: next });
}

function navigateQuestion(index: number) {
  currentQuestionIndex.value = index;
}

async function handleLogout() {
  try {
    syncClientTokenFromStorage();
    await apiClient.authLogout();
  } catch {
    apiClient.clearAccessToken();
  }
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  examActive.value = false;
  cleanup();
  currentView.value = 'login';
}

onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    syncClientTokenFromStorage();
    loadExamList();
  }
});

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <main class="layout">
    <!-- Login View -->
    <div v-if="currentView === 'login'" class="login-panel">
      <form class="login-card" @submit.prevent="handleLogin">
        <h2>候选人登录</h2>
        <div class="form-group">
          <label for="login-username">用户名</label>
          <input
            id="login-username"
            v-model="username"
            name="username"
            type="text"
            autocomplete="username"
            placeholder="请输入用户名"
          />
        </div>
        <div class="form-group">
          <label for="login-password">密码</label>
          <input
            id="login-password"
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
        </div>
        <p v-if="loginError" class="error">{{ loginError }}</p>
        <button type="submit" :disabled="loginLoading" class="btn-primary">
          {{ loginLoading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>

    <!-- Exam List View -->
    <div v-if="currentView === 'list'" class="list-panel">
      <header class="topbar">
        <div>
          <p class="kicker">Examora Desktop</p>
          <h1>选择考试</h1>
        </div>
        <button @click="handleLogout" class="btn-secondary">退出登录</button>
      </header>
      <p v-if="listError" class="error">{{ listError }}</p>
      <p v-if="examError" class="error">{{ examError }}</p>
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
          <span :class="{ warning: paper.remaining_seconds < 300 }">
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
              :key="q.snapshot_id"
              :class="{ active: index === currentQuestionIndex, answered: answers.has(String(q.snapshot_id)) }"
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
            <p>{{ getQuestionText(currentQuestion) }}</p>

            <!-- Answer based on type -->
            <div class="answer-area">
              <template v-if="currentQuestion.type === 'SINGLE_CHOICE'">
                <label v-for="opt in getChoiceOptions(currentQuestion)" :key="opt.key">
                  <input
                    type="radio"
                    :name="'q-' + currentQuestion.snapshot_id"
                    :value="opt.key"
                    :checked="answers.get(String(currentQuestion.snapshot_id))?.choice === opt.key"
                    @change="handleAnswer(String(currentQuestion.snapshot_id), { choice: opt.key })"
                  />
                  <span class="option-key">{{ opt.key }}</span>
                  {{ opt.text }}
                </label>
              </template>
              <template v-else-if="currentQuestion.type === 'MULTIPLE_CHOICE'">
                <label v-for="opt in getChoiceOptions(currentQuestion)" :key="opt.key">
                  <input
                    type="checkbox"
                    :value="opt.key"
                    :checked="isChoiceSelected(String(currentQuestion.snapshot_id), opt.key)"
                    @change="toggleMultipleChoice(String(currentQuestion.snapshot_id), opt.key, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="option-key">{{ opt.key }}</span>
                  {{ opt.text }}
                </label>
              </template>
              <template v-else-if="currentQuestion.type === 'PROGRAMMING'">
                <textarea
                  :value="getAnswerString(String(currentQuestion.snapshot_id), 'code')"
                  @input="handleAnswer(String(currentQuestion.snapshot_id), { code: ($event.target as HTMLTextAreaElement).value })"
                  placeholder="请输入代码..."
                  class="code-editor"
                ></textarea>
                <div v-if="currentQuestion.sample_test_cases?.length" class="sample-cases">
                  示例用例：
                  <div v-for="(tc, i) in currentQuestion.sample_test_cases" :key="i">
                    输入: {{ tc.input }} → 输出: {{ tc.expected_output }}
                  </div>
                </div>
              </template>
              <template v-else>
                <textarea
                  :value="getAnswerString(String(currentQuestion.snapshot_id), 'text')"
                  @input="handleAnswer(String(currentQuestion.snapshot_id), { text: ($event.target as HTMLTextAreaElement).value })"
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
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(29, 20, 13, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.option-key {
  font-weight: 700;
  min-width: 20px;
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
