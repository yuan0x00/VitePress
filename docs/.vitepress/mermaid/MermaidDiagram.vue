<template>
  <div class="mermaid-container">
    <div v-if="renderedSvg" class="mermaid-toolbar">
      <button class="mermaid-action" type="button" @click="openModal">查看</button>
      <button class="mermaid-action" type="button" @click="downloadDiagram">下载</button>
    </div>
    <div class="mermaid-render" v-html="displaySvg"></div>

    <teleport to="body">
      <div v-if="isModalVisible" class="mermaid-modal-mask" @click.self="closeModal">
        <div class="mermaid-modal" @click.stop>
          <div class="mermaid-modal-controls" @pointerdown.stop @pointermove.stop>
            <button class="mermaid-action" type="button" @click="zoomIn">放大</button>
            <button class="mermaid-action" type="button" @click="zoomOut">缩小</button>
            <button class="mermaid-action" type="button" @click="resetView">重置</button>
            <button aria-label="关闭" class="mermaid-action mermaid-action-close" type="button" @click="closeModal">
              关闭
            </button>
          </div>
          <div
              ref="modalViewport"
              :class="{'is-panning': isPanning}"
              class="mermaid-modal-body"
              @pointercancel="handlePointerUp"
              @pointerdown="handlePointerDown"
              @pointerleave="handlePointerUp"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerUp"
              @wheel.prevent="handleWheel"
          >
            <div
                ref="modalCanvas"
                class="mermaid-modal-canvas"
                v-html="renderedSvg"
            ></div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue';
import {useData} from 'vitepress';
import type {MermaidConfig} from 'mermaid';
import {createMermaidRenderer} from './renderer';

const props = defineProps<{ id: string; graph: string }>();

const renderedSvg = ref('');
const renderSalt = ref('');
const displaySvg = computed(() => {
  if (!renderedSvg.value) {
    return '';
  }
  return `${renderedSvg.value}<span style="display:none">${renderSalt.value}</span>`;
});
const {isDark} = useData();
const isClient = typeof window !== 'undefined';
const isModalVisible = ref(false);
const modalViewport = ref<HTMLDivElement | null>(null);
const modalCanvas = ref<HTMLDivElement | null>(null);
const modalScale = ref(1);
const baseViewBox = reactive({x: 0, y: 0, width: 0, height: 0});
const currentViewBox = reactive({x: 0, y: 0, width: 0, height: 0});
const isPanning = ref(false);
const panState = reactive({
  pointerId: null as number | null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  captureEl: null as HTMLElement | null,
});

const DEFAULT_SCALE = 1;
const MIN_SCALE = DEFAULT_SCALE;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.2;
const WHEEL_DAMPING = 0.002;

const renderer = createMermaidRenderer({autoDecode: true});

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const updateSvgViewBox = () => {
  const svg = modalCanvas.value?.querySelector('svg');
  if (!svg) {
    return;
  }
  svg.setAttribute(
      'viewBox',
      `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.width} ${currentViewBox.height}`
  );
};

const clampViewBox = () => {
  if (baseViewBox.width === 0 || baseViewBox.height === 0) {
    return;
  }

  if (currentViewBox.width >= baseViewBox.width) {
    currentViewBox.x = baseViewBox.x + (baseViewBox.width - currentViewBox.width) / 2;
  } else {
    const maxX = baseViewBox.x + baseViewBox.width - currentViewBox.width;
    currentViewBox.x = clamp(currentViewBox.x, baseViewBox.x, maxX);
  }

  if (currentViewBox.height >= baseViewBox.height) {
    currentViewBox.y = baseViewBox.y + (baseViewBox.height - currentViewBox.height) / 2;
  } else {
    const maxY = baseViewBox.y + baseViewBox.height - currentViewBox.height;
    currentViewBox.y = clamp(currentViewBox.y, baseViewBox.y, maxY);
  }
};

const initializeViewBox = () => {
  const svg = modalCanvas.value?.querySelector('svg');
  if (!svg) {
    return;
  }

  let viewBoxAttr = svg.getAttribute('viewBox');
  if (!viewBoxAttr) {
    const widthAttr = svg.getAttribute('width');
    const heightAttr = svg.getAttribute('height');
    if (widthAttr && heightAttr) {
      svg.setAttribute('viewBox', `0 0 ${parseFloat(widthAttr)} ${parseFloat(heightAttr)}`);
      viewBoxAttr = svg.getAttribute('viewBox');
    } else {
      const bbox = svg.getBBox();
      svg.setAttribute('viewBox', `0 0 ${bbox.width || 100} ${bbox.height || 100}`);
      viewBoxAttr = svg.getAttribute('viewBox');
    }
  }

  if (!viewBoxAttr) {
    return;
  }

  const [x, y, width, height] = viewBoxAttr.split(/\s+/).map(Number);
  baseViewBox.x = x;
  baseViewBox.y = y;
  baseViewBox.width = width;
  baseViewBox.height = height;

  currentViewBox.x = x;
  currentViewBox.y = y;
  currentViewBox.width = width;
  currentViewBox.height = height;

  modalScale.value = 1;
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.maxWidth = '100%';
  svg.style.maxHeight = '100%';
  svg.style.display = 'block';
  svg.style.margin = '0 auto';
  updateSvgViewBox();
};

const resetView = () => {
  if (baseViewBox.width === 0 || baseViewBox.height === 0) {
    modalScale.value = DEFAULT_SCALE;
    return;
  }
  if (panState.pointerId !== null) {
    try {
      panState.captureEl?.releasePointerCapture(panState.pointerId);
    } catch (error) {
      // Safari 等浏览器可能在未捕获时抛错，这里忽略
    }
  }
  isPanning.value = false;
  panState.pointerId = null;
  panState.startX = 0;
  panState.startY = 0;
  panState.originX = 0;
  panState.originY = 0;
  panState.captureEl = null;
  modalScale.value = DEFAULT_SCALE;
  currentViewBox.x = baseViewBox.x;
  currentViewBox.y = baseViewBox.y;
  currentViewBox.width = baseViewBox.width;
  currentViewBox.height = baseViewBox.height;
  nextTick(() => updateSvgViewBox());
};

const setScale = (nextScale: number) => {
  const clamped = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  const currentScale = modalScale.value;
  if (clamped === currentScale || !Number.isFinite(clamped)) {
    return;
  }

  const viewport = modalViewport.value;
  if (!viewport) {
    return;
  }

  const rect = viewport.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  applyZoom(clamped, {x: originX, y: originY});
};

const applyZoom = (targetScale: number, origin: { x: number; y: number }) => {
  if (baseViewBox.width === 0 || baseViewBox.height === 0) {
    initializeViewBox();
  }
  const viewport = modalViewport.value;
  const svg = modalCanvas.value?.querySelector('svg');
  if (!viewport || !svg || baseViewBox.width === 0 || baseViewBox.height === 0) {
    return;
  }

  const rect = viewport.getBoundingClientRect();
  const offsetX = origin.x - rect.left;
  const offsetY = origin.y - rect.top;
  const ratioX = rect.width === 0 ? 0.5 : offsetX / rect.width;
  const ratioY = rect.height === 0 ? 0.5 : offsetY / rect.height;

  const newWidth = baseViewBox.width / targetScale;
  const newHeight = baseViewBox.height / targetScale;

  const focusSvgX = currentViewBox.x + currentViewBox.width * ratioX;
  const focusSvgY = currentViewBox.y + currentViewBox.height * ratioY;

  currentViewBox.width = newWidth;
  currentViewBox.height = newHeight;
  currentViewBox.x = focusSvgX - newWidth * ratioX;
  currentViewBox.y = focusSvgY - newHeight * ratioY;

  clampViewBox();
  modalScale.value = targetScale;
  updateSvgViewBox();
};

const zoomIn = () => {
  setScale(modalScale.value * (1 + ZOOM_STEP));
};

const zoomOut = () => {
  setScale(Math.max(DEFAULT_SCALE, modalScale.value * (1 - ZOOM_STEP)));
};

const handleWheel = (event: WheelEvent) => {
  if (!renderedSvg.value) {
    return;
  }

  const dampedStep = Math.exp(-event.deltaY * WHEEL_DAMPING);
  const targetScale = Math.max(DEFAULT_SCALE, modalScale.value * dampedStep);
  applyZoom(targetScale, {x: event.clientX, y: event.clientY});
};

const handleResize = () => {
  if (!isModalVisible.value) {
    return;
  }
  clampViewBox();
  updateSvgViewBox();
};

const handlePointerDown = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return;
  }
  const captureTarget = (event.currentTarget as HTMLElement | null) ?? modalCanvas.value;
  if (!captureTarget) {
    return;
  }

  event.preventDefault();
  isPanning.value = true;
  panState.pointerId = event.pointerId;
  panState.startX = event.clientX;
  panState.startY = event.clientY;
  panState.originX = currentViewBox.x;
  panState.originY = currentViewBox.y;
  panState.captureEl = captureTarget;
  captureTarget.setPointerCapture(event.pointerId);
};

const handlePointerMove = (event: PointerEvent) => {
  if (!isPanning.value || panState.pointerId !== event.pointerId) {
    return;
  }

  const viewport = modalViewport.value;
  if (!viewport) {
    return;
  }

  const rect = viewport.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return;
  }
  const deltaRatioX = (event.clientX - panState.startX) / rect.width;
  const deltaRatioY = (event.clientY - panState.startY) / rect.height;
  const deltaX = deltaRatioX * currentViewBox.width;
  const deltaY = deltaRatioY * currentViewBox.height;

  currentViewBox.x = panState.originX - deltaX;
  currentViewBox.y = panState.originY - deltaY;

  clampViewBox();
  updateSvgViewBox();
};

const finishPan = (event: PointerEvent) => {
  if (panState.pointerId !== event.pointerId) {
    return;
  }

  isPanning.value = false;
  panState.pointerId = null;
  panState.startX = 0;
  panState.startY = 0;
  panState.originX = currentViewBox.x;
  panState.originY = currentViewBox.y;

  if (panState.captureEl) {
    try {
      panState.captureEl.releasePointerCapture(event.pointerId);
    } catch (error) {
      // 无需处理未捕获指针的异常
    }
  }

  panState.captureEl = null;
};

const handlePointerUp = (event: PointerEvent) => {
  if (panState.pointerId !== event.pointerId) {
    return;
  }
  finishPan(event);
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
    const svgCode = await renderer.render({
      id: props.id,
      code: props.graph,
      config,
    });
    renderedSvg.value = svgCode;
    renderSalt.value = Math.random().toString(36).substring(2);
    if (isModalVisible.value) {
      isModalVisible.value = false;
    }
    baseViewBox.x = 0;
    baseViewBox.y = 0;
    baseViewBox.width = 0;
    baseViewBox.height = 0;
    currentViewBox.x = 0;
    currentViewBox.y = 0;
    currentViewBox.width = 0;
    currentViewBox.height = 0;
    resetView();
  } catch (error) {
    console.error('Failed to render Mermaid diagram', error);
  }
};

const openModal = () => {
  if (!renderedSvg.value) {
    return;
  }
  isModalVisible.value = true;
  nextTick(() => {
    initializeViewBox();
    resetView();
  });
};

const closeModal = () => {
  isModalVisible.value = false;
  resetView();
};

const downloadDiagram = () => {
  if (!isClient || !renderedSvg.value) {
    return;
  }

  try {
    const blob = new Blob([renderedSvg.value], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${props.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download Mermaid diagram', error);
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isModalVisible.value) {
    closeModal();
  }
};

onMounted(() => {
  renderChart();
  if (isClient) {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', handleResize);
  }
});

onBeforeUnmount(() => {
  if (isClient) {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', handleResize);
  }
});

watch(
    () => [isDark.value, props.graph],
    () => {
      renderChart();
    }
);

watch(isModalVisible, visible => {
  if (visible) {
    nextTick(() => {
      initializeViewBox();
      resetView();
    });
  }
});
</script>

<style>
.mermaid-container {
  width: 100%;
  border: gainsboro 1px solid;
}

.mermaid-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 4px;
}

.mermaid-action {
  padding: 4px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-2, #444);
  background-color: var(--vp-c-bg-soft, #f7f7f7);
  border: 1px solid var(--vp-c-border, #d9d9d9);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.mermaid-action:hover {
  color: var(--vp-c-text-1, #222);
  background-color: var(--vp-c-bg, #fff);
  border-color: var(--vp-c-border-strong, #bfbfbf);
}

.mermaid-render {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow-x: auto;
}


.mermaid-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  background-color: rgba(0, 0, 0, 0.45);
}


.mermaid-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: transparent;
}

.mermaid-modal-controls {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 3;
}

.mermaid-modal-controls {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 3;
}

.mermaid-action-close {
  color: var(--vp-c-text-2, #555);
  border-color: rgba(0, 0, 0, 0.25);
}

.mermaid-action-close:hover {
  color: var(--vp-c-text-1, #222);
}

.mermaid-modal-body {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: none;
  padding: 0;
  background-color: transparent;
  width: 100%;
  height: 100%;
}

.mermaid-modal-body.is-panning {
  cursor: grabbing;
}

.mermaid-modal-canvas {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.mermaid-modal-canvas svg {
  display: block;
  min-height: 100%;
}
</style>
