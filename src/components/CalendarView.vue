<template>
  <div class="calendar-wrapper">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
    </div>
    <div v-else class="calendar-container">
      <div class="calendar-header">
        <button @click="previousMonth" class="nav-button">&lt;</button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="nextMonth" class="nav-button">&gt;</button>
      </div>
      <div class="calendar-grid">
        <div v-for="day in daysInMonth" :key="day" class="calendar-day" :class="{
          'has-mood': getMoodForDay(day)?.image,
          'is-today': isToday(day)
        }" @click="handleDayClick(day)">
          <img v-if="getMoodForDay(day)?.image" :src="getMoodForDay(day)?.image"
            :alt="getMoodForDay(day)?.alt || 'Mood'" class="mood-icon" />
          <span v-else class="mood-placeholder"></span>
          <span class="day-number">{{ day }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  moodData: {
    type: Object,
    default: () => ({})
  },
  availableMoods: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['date-selected', 'prev-month', 'next-month']);
const currentDate = ref(new Date());
const today = new Date();

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleString('pt-BR', { month: 'long' });
});

function isToday(day) {
  const isSameDay = day === today.getDate();
  const isSameMonth = currentMonth.value === today.getMonth();
  const isSameYear = currentYear.value === today.getFullYear();
  return isSameDay && isSameMonth && isSameYear;
}

function getMoodForDay(dayNumber) {
  const monthData = props.moodData;
  if (monthData) {
    const moodEntry = monthData[dayNumber];
    if (!moodEntry) return null;
    const moodInfo = props.availableMoods.find(m => m.id === moodEntry.moodId);
    if (moodInfo) {
      return { image: moodInfo.src, alt: moodInfo.alt, description: moodEntry.description };
    }
  }
  return null;
}

function handleDayClick(day) {
  const selectedDate = new Date(currentYear.value, currentMonth.value, day);
  const moodDetails = getMoodForDay(day);
  emit('date-selected', { date: selectedDate, moodEntry: moodDetails ? { ...moodDetails, moodId: props.moodData[day]?.moodId } : null });
}

function previousMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
  emit('prev-month', {
    year: currentDate.value.getFullYear(),
    month: currentDate.value.getMonth()
  });
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
  emit('next-month', {
    year: currentDate.value.getFullYear(),
    month: currentDate.value.getMonth()
  });
}
</script>

<style scoped>
.calendar-wrapper {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.calendar-container {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  width: 100%;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 450px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: purple;
  animation: spin 1s ease infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-header h2 {
  margin: 0;
  font-size: 1.5em;
  color: #333;
  text-transform: capitalize;
}

.nav-button {
  background-color: purple;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
}

.nav-button:hover {
  background-color: darkorchid;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-day {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid #eee;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s;
  box-sizing: border-box;
}

.calendar-day:hover {
  background-color: #f0f0f0;
}

.is-today {
  border: 2px solid purple;
}

.mood-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-bottom: 2px;
}

.mood-placeholder {
  width: 40px;
  height: 40px;
  margin-bottom: 2px;
}

.day-number {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.7em;
  color: #555;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 1px 3px;
  border-radius: 2px;
}
</style>
