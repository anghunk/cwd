<template>
  <span>{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  startVal: {
    type: Number,
    default: 0
  },
  endVal: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 1000
  }
});

const displayValue = ref(props.startVal);
const localStartVal = ref(props.startVal);
const startTime = ref<number | null>(null);
const rAF = ref<number | null>(null);

const easeOutExpo = (t: number, b: number, c: number, d: number) => {
  return t === d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
};

const count = (timestamp: number) => {
  if (!startTime.value) startTime.value = timestamp;
  const progress = timestamp - startTime.value;
  
  if (props.duration > 0 && progress < props.duration) {
    const val = easeOutExpo(progress, localStartVal.value, props.endVal - localStartVal.value, props.duration);
    displayValue.value = Math.floor(val);
    rAF.value = requestAnimationFrame(count);
  } else {
    displayValue.value = props.endVal;
    rAF.value = null;
  }
};

const startAnimation = () => {
  startTime.value = null;
  localStartVal.value = displayValue.value;
  if (rAF.value) cancelAnimationFrame(rAF.value);
  rAF.value = requestAnimationFrame(count);
};

watch(() => props.endVal, () => {
  startAnimation();
});

onMounted(() => {
  if (props.endVal !== props.startVal) {
      startAnimation();
  }
});

onBeforeUnmount(() => {
  if (rAF.value) {
    cancelAnimationFrame(rAF.value);
  }
});
</script>
