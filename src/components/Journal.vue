<template>
  <div id="journal-wrapper" style="background-color: transparent;">
    <button @click="handleSair" class="sair-button">Sair</button>
    <div id="journal-container">
      <div class="main-layout">
        <div class="left-column">
          <CalendarView :mood-data="monthData" :available-moods="definedMoods" @date-selected="handleDateSelected"
            @prev-month="handlePrevMonth($event.year, $event.month)"
            @next-month="handleNextMonth($event.year, $event.month)" />
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

const definedMoods = ref([
  { id: 'default', src: new URL('@/assets/images/NewMood.png', import.meta.url).href, alt: 'Novo Humor' },
]);

const monthData = ref({});
const moodDataForSelectedDate = ref(null);

onBeforeMount(async () => {
  const accessToken = localStorage.getItem('access');
  const refreshToken = localStorage.getItem('refresh');

  if (!accessToken || !refreshToken) {
    router.push("/");
    return;
  }

  const moods = await api.get('/api/default-moods/');
  definedMoods.value = [
    { id: 'default', src: new URL('@/assets/images/NewMood.png', import.meta.url).href, alt: 'Novo Humor' },
  ];

  if (moods.status === 200) {
    const moodData = moods.data;
    console.log('Mood data:', moodData);
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

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  await fetchMonth(year, month);
  const today = new Date();
  const day = today.getDate();
  const todayMood = monthData.value[day];
  moodDataForSelectedDate.value = todayMood
    ? {
      entryID: todayMood.entryID,
      moodId: todayMood.moodId,
      src: definedMoods.value.find(m => m.id === todayMood.moodId)?.src,
      alt: definedMoods.value.find(m => m.id === todayMood.moodId)?.alt,
      description: todayMood.description || ''
    }
    : null;
});

const selectedDateForNewMood = ref(new Date());
const newMoodComponentKey = ref(0);

function findMoodEntryForDate(date) {
  if (!date) return null;
  const day = date.getDate();
  return monthData.value[day]
    ? {
      entryID: monthData.value[day].entryID,
      moodId: monthData.value[day].moodId,
      src: definedMoods.value.find(m => m.id === monthData.value[day].moodId)?.src,
      alt: definedMoods.value.find(m => m.id === monthData.value[day].moodId)?.alt,
      description: monthData.value[day].description || ''
    }
    : null;
}

watch(selectedDateForNewMood, (newDate) => {
  moodDataForSelectedDate.value = findMoodEntryForDate(newDate);
});


function handleDateSelected(payload) {
  selectedDateForNewMood.value = payload.date;
  if (payload.moodEntry) {
    moodDataForSelectedDate.value = {
      entryID: payload.moodEntry.entryID,
      moodId: payload.moodEntry.moodId,
      src: payload.moodEntry.image,
      alt: payload.moodEntry.alt,
      description: payload.moodEntry.description || ''
    };
  } else {
    moodDataForSelectedDate.value = null;
  }
  newMoodComponentKey.value++;
  console.log('Selected date:', selectedDateForNewMood.value);
  console.log('Mood data for selected date:', moodDataForSelectedDate.value);
}

function handleSair() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  router.push("/");
}

async function fetchMonth(year, month) {

  const url = `/api/moods/?month=${month}&year=${year}`;

  const res = await api.get(url);
  console.log(res.data)

  const loadData = {}

  if (res.status === 200) {
    for (const entry of res.data) {
      const { entry_date: entryDate, id, mood } = entry;
      const moodId = mood.id;
      const description = entry.description;
      const parts = entryDate.split('-');
      const day = parts[2];
      loadData[day] = {
        entryID: id,
        moodId: moodId,
        description: description,
        day: day,
      };
    }
    monthData.value = { ...loadData };
  } else {
    console.error('Error fetching month data:', res.status);
  }
}

function handlePrevMonth(year, month) {
  fetchMonth(year, month + 2);
}

function handleNextMonth(year, month) {
  fetchMonth(year, month);
}

function handleMoodChange(newmood) {
  const date = newmood.date
  const day = date.getDate();
  monthData.value[day] = {
    entryID: newmood.entryId,
    moodId: newmood.moodId,
    description: newmood.description,
    day: day,
  };
}

function hasMoodEntryForDate(date) {
  const day = date.getDate();
  return monthData.value && monthData.value[day];
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
  position: fixed;
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
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.main-layout {
  display: flex;
  gap: 25px;
  align-items: flex-start;
  background-color: #ffffff;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.left-column {
  flex: 1;
}

.right-column {
  flex: 1;
  display: flex;
  justify-content: center;
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
