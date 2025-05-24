<template>
  <div id="journal-wrapper" style="background-color: transparent;">
    <button @click="handleSair" class="sair-button">Sair</button>
    <div id="journal-container">
      <div class="main-layout">
        <div class="left-column">
          <CalendarView :is-loading="isLoading" :mood-data="monthData" :available-moods="definedMoods"
            @date-selected="handleDateSelected" @prev-month="handleMonthChange($event.year, $event.month)"
            @next-month="handleMonthChange($event.year, $event.month)" />
        </div>
        <div class="right-column">
          <NewMood :key="newMoodComponentKey" :selected-date-prop="selectedDateForNewMood"
            :initial-mood-data-prop="moodDataForSelectedDate" :all-mood-images-prop="definedMoods"
            :day-has-mood-function="hasMoodEntryForDate" @new-mood="handleMoodChange($event)"
            @edit-mood="handleMoodChange($event)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, watch } from 'vue';
import NewMood from './NewMood.vue';
import CalendarView from './CalendarView.vue';
import router from '../router/index.js';
import api from '../services/api.js';

const definedMoods = ref([]);
const monthData = ref({});
const moodDataForSelectedDate = ref(null);
const newMoodComponentKey = ref(0);
const selectedDateForNewMood = ref(new Date());
const isLoading = ref(true);

async function handleMonthChange(year, month) {
  isLoading.value = true;
  const data = await fetchMonth(year, month + 1);
  monthData.value = data;
  isLoading.value = false;
}

async function fetchMonth(year, month) {
  try {
    const url = `/api/moods/?month=${month}&year=${year}`;
    const res = await api.get(url);
    const loadData = {};

    if (res.status === 200) {
      for (const entry of res.data) {
        const { entry_date: entryDate, id, mood } = entry;
        const day = parseInt(entryDate.split('-')[2], 10);
        loadData[day] = {
          entryID: id,
          moodId: mood.id,
          description: entry.description,
          day: day,
        };
      }
      return loadData;
    }
  } catch (error) {
    console.error(`Error fetching month data for ${year}-${month}:`, error);
  }
  return {};
}

onBeforeMount(async () => {
  const accessToken = localStorage.getItem('access');
  if (!accessToken) {
    router.push("/");
    return;
  }

  isLoading.value = true;

  await loadDefaultMoods();

  const today = new Date();
  await handleMonthChange(today.getFullYear(), today.getMonth());

  const day = today.getDate();
  const todayMood = monthData.value[day];
  if (todayMood) {
    moodDataForSelectedDate.value = findMoodEntryForDate(today);
  } else {
    moodDataForSelectedDate.value = null;
  }

  isLoading.value = false;
});

watch(selectedDateForNewMood, (newDate) => {
  moodDataForSelectedDate.value = findMoodEntryForDate(newDate);
});

async function loadDefaultMoods() {
  const moods = await api.get('/api/default-moods/');
  definedMoods.value = [
    { id: 'default', src: new URL('@/assets/images/NewMood.png', import.meta.url).href, alt: 'Novo Humor' },
  ];
  if (moods.status === 200) {
    const moodData = moods.data;
    for (const mood of moodData) {
      definedMoods.value.push({
        id: mood.id,
        src: mood.image,
        alt: mood.description
      });
    }
  } else {
    console.error('Error fetching mood data:', moods.status);
  }
}

function handleDateSelected(payload) {
  selectedDateForNewMood.value = payload.date;
  moodDataForSelectedDate.value = findMoodEntryForDate(payload.date);
  newMoodComponentKey.value++;
}

function handleMoodChange(newmood) {
  const date = newmood.date;
  const day = date.getDate();
  monthData.value[day] = {
    entryID: newmood.entryId,
    moodId: newmood.moodId,
    description: newmood.description,
    day: day,
  };
}

function findMoodEntryForDate(date) {
  if (!date) return null;
  const day = date.getDate();
  if (monthData.value && monthData.value[day]) {
    const dayData = monthData.value[day];
    return {
      entryID: dayData.entryID,
      moodId: dayData.moodId,
      src: definedMoods.value.find(m => m.id === dayData.moodId)?.src,
      alt: definedMoods.value.find(m => m.id === dayData.moodId)?.alt,
      description: dayData.description || ''
    };
  }
  return null;
}

function hasMoodEntryForDate(date) {
  const day = date.getDate();
  return monthData.value && monthData.value[day];
}

function handleSair() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  router.push("/");
}
</script>
<style scoped>
#journal-wrapper {
  min-height: 100vh;
  padding-top: 80px;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 40px;
  box-sizing: border-box;
  width: 100%;
}

.sair-button {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  z-index: 1001;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s ease;
}

.sair-button:hover {
  background-color: #5a6268;
}

#journal-container {
  width: 100%;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}

.main-layout {
  display: flex;
  gap: 125px;
  align-items: flex-start;
  background-color: #ffffff;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.left-column,
.right-column {
  flex: 1;
  display: flex;
  justify-content: center;
}

.right-column {
  max-width: 40%;
}

@media (max-width: 900px) {
  #journal-wrapper {
    padding-left: 15px;
    padding-right: 15px;
  }

  .main-layout {
    flex-direction: column;
    align-items: center;
    padding: 20px;
    gap: 20px;
  }

  .left-column,
  .right-column {
    width: 100%;
    max-width: 600px;
  }

  .right-column {
    margin-top: 20px;
  }
}
</style>
