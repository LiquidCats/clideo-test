<template>
    <TransformationBox />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TransformationBox from './components/TransformationBox.vue';

export default defineComponent({
  name: 'App',
  components: {
      TransformationBox,
  },
});
</script>