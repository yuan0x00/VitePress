import * as fs from 'node:fs/promises';
import type {Dirent} from 'node:fs';
import * as path from 'node:path';
import {defineConfig} from 'vitepress';
import {setupMermaidMarkdown} from "./mermaid/markdown-plugin";

const DOCS_ROOT = path.resolve(__dirname, '..');
const collator = new Intl.Collator('en', {numeric: true, sensitivity: 'base'});

const toFsPath = (...segments: string[]) => path.join(DOCS_ROOT, ...segments.filter(Boolean));
const toUrlPath = (relative: string) => `/${relative.replace(/\\/g, '/')}`;
const toDirUrl = (relative: string) => (relative ? `${toUrlPath(relative)}/` : '/');

const formatTitle = (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

const sortByName = (entries: Dirent[]) =>
    [...entries].sort((a, b) => collator.compare(a.name, b.name));

const listDir = async (relative = ''): Promise<Dirent[]> => {
    const directory = toFsPath(relative);
    try {
        return sortByName(await fs.readdir(directory, {withFileTypes: true}));
    } catch (error) {
        console.warn(`Unable to read directory: ${directory}`, error);
        return [];
    }
};

const hasIndexMarkdown = async (relativeDir: string) => {
    try {
        await fs.access(toFsPath(relativeDir, 'index.md'));
        return true;
    } catch {
        return false;
    }
};

const buildSidebarItems = async (relativeDir = ''): Promise<any[]> => {
    const entries = await listDir(relativeDir);
    const items: any[] = [];

    const markdownEntries = entries.filter(entry => entry.isFile() && entry.name.endsWith('.md'));
    const indexEntry = markdownEntries.find(entry => entry.name === 'index.md');

    if (indexEntry) {
        items.push({
            text: '概览',
            link: toDirUrl(relativeDir),
            collapsed: false,
        });
    }

    for (const entry of markdownEntries) {
        if (entry.name === 'index.md') {
            continue;
        }

        const entryPath = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
        const basename = path.basename(entry.name, '.md');
        items.push({
            text: formatTitle(basename),
            link: toUrlPath(entryPath.replace(/\.md$/, '')),
            collapsed: false,
        });
    }

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        const entryPath = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
        const nested = await buildSidebarItems(entryPath);
        if (nested.length > 0) {
            items.push({
                text: formatTitle(entry.name),
                collapsed: false,
                items: nested,
            });
        }
    }

    return items;
};

const buildNav = async () => {
    const entries = await listDir();
    const navItems = await Promise.all(
        entries
            .filter(entry => entry.isDirectory())
            .map(async entry => {
                if (!(await hasIndexMarkdown(entry.name))) {
                    return null;
                }
                return {
                    text: formatTitle(entry.name),
                    link: toDirUrl(entry.name),
                };
            })
    );

    return [{text: 'Home', link: '/'}, ...navItems.filter(Boolean) as { text: string; link: string }[]];
};

const buildSidebar = async () => {
    const sidebar: Record<string, { text: string; collapsed: boolean; items: any[] }[]> = {};
    const entries = await listDir();

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }
        const items = await buildSidebarItems(entry.name);
        if (items.length === 0) {
            continue;
        }
        sidebar[toDirUrl(entry.name)] = [
            {
                text: formatTitle(entry.name),
                collapsed: false,
                items,
            },
        ];
    }

    const rootItems = await buildSidebarItems('');
    if (rootItems.length > 0) {
        sidebar['/'] = [
            {
                text: '文档概览',
                collapsed: false,
                items: rootItems,
            },
        ];
    }

    return sidebar;
};

export default defineConfig({
    title: 'Blog',
    description: 'Blog',
    lang: 'zh-CN',
    base: '/VitePress/',
    cleanUrls: true,
    lastUpdated: true,
    head: [
        ['link', {rel: 'icon', type: 'image/svg+xml', href: 'https://vitepress.dev/vitepress-logo-mini.svg'}],
        ['link', {rel: 'icon', type: 'image/png', href: 'https://vitepress.dev/vitepress-logo-mini.png'}],
    ],
    themeConfig: {
        logo: "/android.svg",
        outline: {
            label: "目录",
        },
        docFooter: {
            prev: "上一页",
            next: "下一页",
        },
        darkModeSwitchLabel: "深浅模式",
        returnToTopLabel: "返回顶部",
        search: {
            provider: 'local',
        },
        nav: await buildNav(),
        sidebar: await buildSidebar(),
        lastUpdated: {
            text: '最近更新',
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/yuan0x00'},
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
