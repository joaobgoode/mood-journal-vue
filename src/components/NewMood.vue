<template>
  <div class="new-mood-container">
    <img :src="displayMood.src" :alt="displayMood.alt" @click="openMoodSelector" class="mood-image" />

    <MoodSelectorOverlay v-if="isOverlayVisible" :moodImages="allMoodImages"
      @mood-selected="handleMoodSelectedFromOverlay" @close-overlay="closeMoodSelector" />
    <p class="fw-bold selected-date">{{ fomatDate(props.selectedDateProp) }}</p>
    <div class="description-section">
      <textarea v-model="moodDescription" placeholder="Descreva como você está se sentindo..." maxlength="255"
        class="mood-textarea" :disabled="isFutureDate"></textarea>
      <div class="char-counter" v-if="!isFutureDate">
        {{ moodDescription.length }} / 255
      </div>
      <button v-if="buttonState.visible" @click="submitMood" class="publish-button" :class="buttonState.styleClass">
        {{ buttonState.text }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, onMounted } from 'vue';
import MoodSelectorOverlay from './MoodSelectorOverlay.vue';
import api from '../services/api.js';

const emit = defineEmits(["new-mood", "edit-mood"]);

const props = defineProps({
  selectedDateProp: {
    type: Date,
    default: () => new Date()
  },
  initialMoodDataProp: {
    type: Object,
    default: null
  },
  allMoodImagesProp: {
    type: Array,
    required: true
  },
  dayHasMoodFunction: Function,
});

const defaultMoodImageDetails = computed(() => props.allMoodImagesProp.find(m => m.id === 'default') || props.allMoodImagesProp[0]);

const currentSelectedMood = ref(null);
const moodDescription = ref('');
const isOverlayVisible = ref(false);

const allMoodImages = computed(() => props.allMoodImagesProp);
const dayHasMood = ref(false);

function normalizeDate(date) {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const todayNormalized = normalizeDate(new Date());

const isFutureDate = computed(() => {
  if (!props.selectedDateProp) return false;
  return normalizeDate(props.selectedDateProp) > todayNormalized;
});


function loadInitialData() {
  if (props.initialMoodDataProp) {
    const moodInfo = props.allMoodImagesProp.find(m => m.id === props.initialMoodDataProp.moodId);
    currentSelectedMood.value = moodInfo || defaultMoodImageDetails.value;
    moodDescription.value = props.initialMoodDataProp.description || '';
  } else {
    currentSelectedMood.value = defaultMoodImageDetails.value;
    moodDescription.value = '';
  }
  dayHasMood.value = props.dayHasMoodFunction(props.selectedDateProp);
}

watch(() => [props.selectedDateProp, props.initialMoodDataProp], () => {
  loadInitialData();
  dayHasMood.value = props.dayHasMoodFunction(props.selectedDateProp);
}, { immediate: true });


const displayMood = computed(() => {
  return currentSelectedMood.value || defaultMoodImageDetails.value;
});

function openMoodSelector() {
  if (isFutureDate.value) return;
  isOverlayVisible.value = true;
}

function closeMoodSelector() {
  isOverlayVisible.value = false;
}

function handleMoodSelectedFromOverlay(moodImage) {
  currentSelectedMood.value = moodImage;
  closeMoodSelector();
}

const buttonState = computed(() => {
  if (isFutureDate.value) {
    return { text: '', visible: false, styleClass: '' };
  }
  if (dayHasMood.value) {
    return { text: 'Editar', visible: true, styleClass: 'edit-button' };
  }
  return { text: 'Publicar', visible: true, styleClass: 'publish-button-style' };
});

async function submitMood() {

  if (currentSelectedMood.value.id === 'default') {
    console.warn("Por favor, selecione um humor específico.");
    return;
  }

  if (isFutureDate.value) {
    console.warn("Não é possível publicar/editar humores para datas futuras.");
    return;
  }

  if (!currentSelectedMood.value || currentSelectedMood.value.id === 'default') {
    console.warn("Por favor, selecione um humor específico.");
  }

  if (buttonState.value.text === 'Publicar') {
    const data = await publicar(currentSelectedMood.value.id, props.selectedDateProp, moodDescription.value);
    emit("new-mood", {
      entryId: data.id,
      date: props.selectedDateProp,
      moodId: currentSelectedMood.value.id,
      description: moodDescription.value
    });

  } else {
    await editar(currentSelectedMood.value.id, props.selectedDateProp, moodDescription.value);
    emit("edit-mood", {
      entryId: props.initialMoodDataProp.entryID,
      date: props.selectedDateProp,
      moodId: currentSelectedMood.value.id,
      description: moodDescription.value
    });
  }
  dayHasMood.value = props.dayHasMoodFunction(props.selectedDateProp)
}

async function publicar(moodId, date, description) {
  const res = await api.post('/api/moods/', {
    mood_id: moodId,
    entry_date: date.toISOString().split('T')[0],
    description: description
  });

  if (res.status === 201) {
    console.log("Humor publicado com sucesso!");
    console.log("Dados retornados:", res.data);
  } else {
    console.error("Erro ao publicar humor:", res.status);
  }
  return res.data;
}

async function editar(moodId, date, description) {
  console.log(props.initialMoodDataProp);
  const entryId = props.initialMoodDataProp.entryID;
  const res = await api.patch(`/api/moods/${entryId}/`, {
    mood_id: moodId,
    entry_date: date.toISOString().split('T')[0],
    description: description
  });

  if (res.status === 200) {
    console.log("Humor editado com sucesso!");
    console.log("Dados retornados:", res.data);
  } else {
    console.error("Erro ao publicar humor:", res.status);
  }
}

function fomatDate(date) {
  if (!date) return '';
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Intl.DateTimeFormat('pt-BR', options).format(date);
}

</script>

<style scoped>
.new-mood-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 500px;
}


.mood-image {
  width: 155px;
  height: 155px;
  cursor: pointer;
  border: 2px solid transparent;
  object-fit: cover;
  border-radius: 50%;
  transition: border-color 0.3s ease, transform 0.3s ease;
}

.mood-image:hover {
  border-color: purple;
  transform: scale(1.05);
}

.description-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.mood-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px 18px;
  border-radius: 15px;
  border: 3px solid purple;
  background-color: transparent;
  font-family: inherit;
  font-size: 1rem;
  color: #333;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.mood-textarea:disabled {
  background-color: #f8f8f8;
  cursor: not-allowed;
  color: #aaa;
  border-color: #ddd;
}

.mood-textarea::placeholder {
  color: #aaa;
}

.mood-textarea:focus {
  outline: none;
  border-color: darkorchid;
}

.char-counter {
  font-size: 0.85rem;
  color: #666;
  margin-top: 8px;
  align-self: flex-end;
  margin-right: 5px;
}

.publish-button {
  margin-top: 5px;
  padding: 12px 30px;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  min-width: 150px;
  text-align: center;
}

.publish-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.publish-button:active {
  transform: translateY(0px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.publish-button-style {
  background-color: purple;
}

.publish-button-style:hover {
  background-color: darkorchid;
}

.edit-button {
  background-color: #007bff;
}

.edit-button:hover {
  background-color: #0056b3;
}

.selected-date {
  font-size: 1.2rem;
  font-weight: bold;
  color: purple;
}
</style>
