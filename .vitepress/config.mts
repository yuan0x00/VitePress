import {defineConfig} from 'vitepress';
import {setupMermaidMarkdown} from './mermaid/markdown-plugin';
import {nav} from './nav';
import {sidebar} from './sidebar';

export default defineConfig({
    title: 'Blog',

    lastUpdated: true,
    cleanUrls: true,
    metaChunk: true,

    base: '/VitePress/',
    srcDir: 'docs',

    head: [
        ['link', {rel: 'icon', type: 'image/svg+xml', href: 'https://vitepress.dev/vitepress-logo-mini.svg'}],
        ['link', {rel: 'icon', type: 'image/png', href: 'https://vitepress.dev/vitepress-logo-mini.png'}],
    ],
    themeConfig: {
        logo: {src: '/android.svg', width: 24, height: 24},

        search: {
            provider: 'local',
        },

        nav,
        sidebar,

        outline: {
            label: '目录',
        },
        docFooter: {
            prev: '上一篇',
            next: '下一篇',
        },
        lastUpdated: {
            text: '最近更新',
        },
        darkModeSwitchLabel: '深浅模式',
        returnToTopLabel: '返回顶部',
        editLink: {
            pattern: 'https://github.com/yuan0x00/VitePress/blob/main/docs/:path',
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/yuan0x00/VitePress/'},
        ],
    },
    markdown: {
        lineNumbers: true,
        theme: {
            light: 'github-light',
            dark: 'github-dark',
        },
        config: (md) => {
            setupMermaidMarkdown(md);
        },
    },
});
