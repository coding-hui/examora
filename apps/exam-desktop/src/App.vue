<script setup lang="ts">
const events = [
  "APP_START",
  "WINDOW_BLUR",
  "FULLSCREEN_EXIT",
  "COPY_ATTEMPT",
  "NETWORK_OFFLINE",
];
</script>

<template>
  <main class="layout">
    <header class="topbar">
      <div>
        <p class="kicker">Examora Desktop</p>
        <h1>Candidate Exam Shell</h1>
      </div>
      <div class="status">
        <span>Timer: 90:00</span>
        <span>Network: Online</span>
        <span>Autosave: Idle</span>
      </div>
    </header>

    <section class="panel">
      <div class="column">
        <h2>Question Nav</h2>
        <p>Question snapshots will be loaded from candidate-safe APIs only.</p>
      </div>
      <div class="column wide">
        <h2>Question Body</h2>
        <p>
          Draft answers belong to the session answer store. Formal programming
          submissions are tracked separately.
        </p>
      </div>
      <div class="column">
        <h2>Client Events</h2>
        <ul>
          <li v-for="event in events" :key="event">{{ event }}</li>
        </ul>
      </div>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  background:
    linear-gradient(135deg, rgba(249, 201, 145, 0.2), transparent 30%),
    linear-gradient(180deg, #f9f4eb 0%, #f0e1cc 100%);
  color: #1d140d;
}

.layout {
  min-height: 100vh;
  padding: 24px;
}

.topbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.kicker {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #7d5d42;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.8rem);
}

.status {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.status span,
.column {
  border: 1px solid rgba(29, 20, 13, 0.12);
  border-radius: 18px;
  background: rgba(255, 251, 245, 0.78);
  backdrop-filter: blur(10px);
}

.status span {
  padding: 10px 14px;
}

.panel {
  display: grid;
  grid-template-columns: 1fr 1.8fr 1fr;
  gap: 16px;
}

.column {
  padding: 18px;
}

.wide {
  min-height: 420px;
}

ul {
  margin: 0;
  padding-left: 18px;
}

@media (max-width: 900px) {
  .topbar,
  .panel {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>
