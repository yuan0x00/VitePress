import DefaultTheme from 'vitepress/theme';
import {default as MermaidDiagram} from '../mermaid/MermaidDiagram.vue';
import type {EnhanceAppContext} from 'vitepress';

export default {
    ...DefaultTheme,
    enhanceApp({app}: EnhanceAppContext) {
        app.component('Mermaid', MermaidDiagram);
    },
};
