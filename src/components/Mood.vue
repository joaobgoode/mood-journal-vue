<template>
  <img class="mood" :src="url" :alt="mood" />
</template>

<script setup>
const props = defineProps({
  mood: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
})
</script>
