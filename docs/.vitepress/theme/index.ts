import DefaultTheme from 'vitepress/theme';
import {MermaidDiagram} from '../mermaid';
import type {EnhanceAppContext} from 'vitepress';
import './style.css'

export default {
    ...DefaultTheme,
    enhanceApp({app}: EnhanceAppContext) {
        app.component('Mermaid', MermaidDiagram);
    },
};
