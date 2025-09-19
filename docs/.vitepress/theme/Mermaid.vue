<template>
  <div class="mermaid-render" v-html="svg"></div>
</template>

<script lang="ts" setup>
import {onMounted, ref, watch} from 'vue';
import {useData} from 'vitepress';
import mermaid, {type MermaidConfig} from 'mermaid';

const props = defineProps<{ id: string; graph: string }>();

const svg = ref('');
const {isDark} = useData();
const isClient = typeof window !== 'undefined';
let initializedConfigKey: string | null = null;

const ensureInitialized = (config: MermaidConfig) => {
  const key = JSON.stringify(config);
  if (initializedConfigKey === key) {
    return;
  }
  mermaid.initialize({...config});
  initializedConfigKey = key;
};

const renderChart = async () => {
  if (!isClient) {
    return;
  }

  try {
    const config: MermaidConfig = {
      securityLevel: 'loose',
      startOnLoad: false,
      theme: isDark.value ? 'dark' : 'default',
    };
    ensureInitialized(config);
    const code = decodeURIComponent(props.graph);
    const {svg: svgCode} = await mermaid.render(props.id, code);
    const salt = Math.random().toString(36).substring(2);
    svg.value = `${svgCode}<span style="display:none">${salt}</span>`;
  } catch (error) {
    console.error('Failed to render Mermaid diagram', error);
  }
};

onMounted(() => {
  renderChart();
});

watch(
  () => [isDark.value, props.graph],
  () => {
    renderChart();
  }
);
</script>

<style>
.mermaid-render {
  width: 100%;
}
</style>
