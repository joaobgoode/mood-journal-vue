<template>
  <div class="overlay-backdrop" @click.self="close">
    <div class="overlay-content">
      <h2>Selecione seu humor:</h2>
      <div class="mood-grid">
        <div v-for='mood in moodImagesFiltered' :key="mood.id" class="mood-item" @click="selectMood(mood)">
          <img :src="mood.src" :alt="mood.alt" />
        </div>
      </div>
      <button @click="close" class="close-button">Fechar</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { computed } from 'vue'

const props = defineProps({
  moodImages: {
    type: Array,
    required: true,
  },
});

const moodImagesFiltered = computed(() =>
  props.moodImages.filter(m => m.id !== 'default')
)


const emit = defineEmits(['mood-selected', 'close-overlay']);

function selectMood(mood) {
  emit('mood-selected', mood);
}

function close() {
  emit('close-overlay');
}
</script>

<style scoped>
.overlay-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.overlay-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-height: 80vh;
  overflow-y: auto;
  text-align: center;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
  margin-top: 15px;
  margin-bottom: 20px;
  max-width: 600px;
}

.mood-item {
  cursor: pointer;
  border: 1px solid transparent;
  padding: 5px;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.mood-item:hover {
  border-color: #007bff;
}

.mood-item img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
}

.close-button {
  padding: 10px 20px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.close-button:hover {
  background-color: #c82333;
}
</style>
