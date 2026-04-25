<script setup lang="ts">
const modules = [
  "Users",
  "Subjects",
  "Questions",
  "Papers",
  "Exams",
  "Scores",
];
</script>

<template>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Examora Admin</p>
      <h1>MVP v1 Console Skeleton</h1>
      <p class="copy">
        The admin app is intentionally thin at bootstrap time. It exists to anchor
        role-separated DTOs and the management workflows defined in the docs.
      </p>
    </section>

    <section class="grid">
      <article v-for="module in modules" :key="module" class="card">
        <h2>{{ module }}</h2>
        <p>Reserved for the MVP management flow.</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top, rgba(212, 189, 149, 0.25), transparent 35%),
    linear-gradient(180deg, #f4efe7 0%, #ede4d5 100%);
  color: #211d18;
}

.shell {
  min-height: 100vh;
  padding: 48px 24px;
}

.hero {
  max-width: 760px;
  margin-bottom: 32px;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6f5d4b;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  line-height: 0.95;
}

.copy {
  margin: 0;
  max-width: 640px;
  font-size: 1.05rem;
  line-height: 1.6;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.card {
  padding: 20px;
  border: 1px solid rgba(33, 29, 24, 0.12);
  border-radius: 20px;
  background: rgba(255, 250, 242, 0.78);
  backdrop-filter: blur(10px);
}

.card h2 {
  margin: 0 0 8px;
}

.card p {
  margin: 0;
  color: #52473b;
}
</style>
