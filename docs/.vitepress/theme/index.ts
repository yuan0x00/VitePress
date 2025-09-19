import DefaultTheme from 'vitepress/theme';
import Mermaid from './Mermaid.vue';
import type {EnhanceAppContext} from 'vitepress';
import './style.css'

export default {
    ...DefaultTheme,
    enhanceApp({app}: EnhanceAppContext) {
        app.component('Mermaid', Mermaid);
    },
};

