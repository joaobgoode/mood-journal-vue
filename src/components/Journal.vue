<template>
  <div id="journal-wrapper" style="background-color: transparent;">
    <div v-if="errorMessage" class="error-message">
      <span>Ocorreu um erro: {{ errorMessage }}</span>
      <button @click="errorMessage = null" class="close-error-button">Fechar</button>
    </div>

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
const monthOnCalendar = ref(new Date().getMonth());
const moodDataForSelectedDate = ref(null);
const newMoodComponentKey = ref(0);
const selectedDateForNewMood = ref(new Date());
const isLoading = ref(true);
const errorMessage = ref(null); // Novo estado para mensagens de erro

async function handleMonthChange(year, month) {
  isLoading.value = true;
  errorMessage.value = null; // Limpa erros anteriores
  try {
    const data = await fetchMonth(year, month + 1);
    monthOnCalendar.value = month;
    monthData.value = data;
  } catch (error) {
    console.error("Falha ao alterar o mês:", error);
    errorMessage.value = error.message || "Não foi possível carregar os dados do mês.";
    monthData.value = {}; // Garante que dados antigos não sejam exibidos
  } finally {
    isLoading.value = false; // Garante que o loading sempre termine
  }
}

async function fetchMonth(year, month) {
  try {
    const url = `/api/moods/?month=${month}&year=${year}`;
    const res = await api.get(url);

    if (res.status === 200) {
      const loadData = {};
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
    } else {
      throw new Error(`Falha ao buscar dados. Status: ${res.status}`);
    }
  } catch (error) {
    console.error(`Erro na requisição para ${year}-${month}:`, error);
    throw error;
  }
}

onBeforeMount(async () => {
  const accessToken = localStorage.getItem('access');
  if (!accessToken) {
    router.push("/");
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
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
  } catch (error) {
    console.error("Erro na montagem inicial do componente:", error);
    errorMessage.value = error.message || "Ocorreu um erro ao carregar os dados iniciais.";
  } finally {
    isLoading.value = false;
  }
});


watch(selectedDateForNewMood, (newDate) => {
  moodDataForSelectedDate.value = findMoodEntryForDate(newDate);
});

async function loadDefaultMoods() {
  try {
    const moods = await api.get('/api/default-moods/');
    if (moods.status === 200) {
      const moodData = moods.data;
      const loadedMoods = [
        { id: 'default', src: new URL('@/assets/images/NewMood.png', import.meta.url).href, alt: 'Novo Humor' }
      ];
      for (const mood of moodData) {
        loadedMoods.push({
          id: mood.id,
          src: mood.image,
          alt: mood.description
        });
      }
      definedMoods.value = loadedMoods;
    } else {
      throw new Error(`Erro ao buscar humores padrão. Status: ${moods.status}`);
    }
  } catch (error) {
    console.error('Erro na requisição de humores padrão:', error);
    throw new Error("Não foi possível carregar as opções de humor.");
  }
}

function handleDateSelected(payload) {
  selectedDateForNewMood.value = payload.date;
  moodDataForSelectedDate.value = findMoodEntryForDate(payload.date);
  newMoodComponentKey.value++;
}

function handleMoodChange(newmood) {
  const date = newmood.date;
  const month = date.getMonth();
  if (month !== monthOnCalendar.value) {
    return;
  }
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
.error-message {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #f8d7da;
  color: #721c24;
  padding: 15px 25px;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.close-error-button {
  background: none;
  border: 1px solid #721c24;
  color: #721c24;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 5px;
  font-weight: bold;
}

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
