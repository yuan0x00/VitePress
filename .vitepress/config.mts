import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {defineConfig} from "vitepress";
import MermaidExample from './mermaid-markdown-all.js';

// 配置项：允许自定义根目录
interface Config {
    rootDir: string;
}

// 默认配置
const config: Config = {
    rootDir: path.resolve(__dirname, '..'),
};

// 辅助函数：将文件名转换为标题
function formatTitle(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
}

// 序号自然排序
function naturalCompare(text1: string, text2: string) {
    const collator = new Intl.Collator('en', {numeric: true, sensitivity: 'base'});
    return collator.compare(text1, text2);
}

// 生成导航栏
async function generateNav(): Promise<{ text: string; link: string }[]> {
    try {
        const stat = await fs.stat(config.rootDir);
        if (!stat.isDirectory()) {
            console.warn(`Root directory ${config.rootDir} does not exist`);
            return [{text: 'Home', link: '/'}];
        }

        const entries = await fs.readdir(config.rootDir, {withFileTypes: true});
        const folders = entries
            .filter(dirent => dirent.isDirectory())
            .sort((a, b) => naturalCompare(a.name, b.name));

        const navItems = await Promise.all(
            folders.map(async dirent => {
                const indexPath = path.join(config.rootDir, dirent.name, 'index.md');
                try {
                    await fs.access(indexPath);
                    return {
                        text: formatTitle(dirent.name),
                        link: `/${dirent.name}/`,
                    };
                } catch {
                    return null;
                }
            })
        );

        return [{text: 'Home', link: '/'}, ...navItems.filter(item => item !== null)];
    } catch (error) {
        console.error('Error generating nav:', error);
        return [{text: 'Home', link: '/'}];
    }
}

// 生成侧边栏
async function generateSidebar(): Promise<Record<string, { text: string; items: any[] }[]>> {
    try {
        const stat = await fs.stat(config.rootDir);
        if (!stat.isDirectory()) {
            console.warn(`Root directory ${config.rootDir} does not exist`);
            return {};
        }

        const sidebar: Record<string, { text: string; collapsed: boolean; items: any[] }[]> = {};
        const entries = await fs.readdir(config.rootDir, {withFileTypes: true});
        const folders = entries
            .filter(dirent => dirent.isDirectory())
            .sort((a, b) => naturalCompare(a.name, b.name));

        for (const folder of folders) {
            const folderPath = path.join(folder.name);
            const sidebarKey = `${folderPath}/`;
            const items = await generateSidebarItems(folderPath);
            if (items.length > 0) {
                sidebar[sidebarKey] = [
                    {
                        text: formatTitle(folder.name),
                        collapsed: false,
                        items,
                    },
                ];
            }
        }

        // 处理根目录下的 Markdown 文件
        const rootItems = await generateSidebarItems('');
        if (rootItems.length > 0) {
            sidebar['/'] = [
                {
                    text: 'Root',
                    collapsed: false,
                    items: rootItems,
                },
            ];
        }

        return sidebar;
    } catch (error) {
        console.error('Error generating sidebar:', error);
        return {};
    }
}

// 生成侧边栏子项（支持当前目录和子目录，包括 index.md）
async function generateSidebarItems(dir: string): Promise<any[]> {
    const fullPath = path.join(config.rootDir, dir || '');
    try {
        await fs.access(fullPath);
    } catch {
        console.warn(`Directory ${fullPath} does not exist`);
        return [];
    }

    const sidebar: any[] = [];
    const entries = await fs.readdir(fullPath, {withFileTypes: true});
    const sortedEntries = entries.sort((a, b) => naturalCompare(a.name, b.name));

    // 处理当前目录下的 Markdown 文件（包括 index.md）
    for (const item of sortedEntries) {
        const itemPath = dir ? path.join(dir, item.name) : item.name;
        if (item.isFile() && item.name.endsWith('.md')) {
            const name = path.basename(item.name, '.md');
            sidebar.push({
                // text: formatTitle(name),
                text: formatTitle(name === 'index' ? '概览' : name),
                collapsed: false,
                link: name === 'index' ? `/${dir}/` : `/${itemPath.replace(/\.md$/, '')}`,
            });
        }
    }

    // 处理子目录
    for (const item of sortedEntries) {
        const itemPath = dir ? path.join(dir, item.name) : item.name;
        if (item.isDirectory()) {
            const nestedItems = await generateSidebarItems(itemPath);
            if (nestedItems.length > 0) {
                sidebar.push({
                    text: formatTitle(item.name),
                    collapsed: false,
                    items: nestedItems,
                });
            }
        }
    }

    return sidebar;
}

export default defineConfig({
    title: 'Blog',
    base: '/VitePress/',
    cleanUrls: true,
    themeConfig: {
        search: {
            provider: 'local',
        },
        nav: await generateNav(),
        sidebar: await generateSidebar(),
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
            MermaidExample(md);
        },
    },
});