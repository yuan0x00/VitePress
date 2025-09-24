import type {DefaultTheme} from 'vitepress';

const createSidebarItem = (link: string, text?: string): DefaultTheme.SidebarItem => {
    const normalizedLink = link.endsWith('/') ? link.slice(0, -1) : link;
    const segments = normalizedLink.split('/').filter(Boolean);
    const filename = segments[segments.length - 1] ?? '';
    const textName = decodeURIComponent(filename);
    return {text: text ?? textName, link};
};

const androidSidebar: DefaultTheme.SidebarItem[] = [
    {
        text: '概览',
        items: [
            createSidebarItem('/android/', '概览')
        ]
    },
    {
        text: '语言与基础',
        items: [
            createSidebarItem('/android/语言与基础/Android应用构建流程'),
            createSidebarItem('/android/语言与基础/Android应用启动流程'),
            createSidebarItem('/android/语言与基础/Java Android知识体系'),
            createSidebarItem('/android/语言与基础/Jvm对比Art'),
        ],
    },
    {
        text: '组件与机制',
        items: [
            {
                text: '应用组件',
                items: [
                    createSidebarItem('/android/组件与机制/应用组件/Activity详解'),
                    createSidebarItem('/android/组件与机制/应用组件/Service详解'),
                    createSidebarItem('/android/组件与机制/应用组件/BroadcastReceiver详解'),
                    createSidebarItem('/android/组件与机制/应用组件/ContentProvider详解'),
                    createSidebarItem('/android/组件与机制/应用组件/Fragment详解'),
                ],
            },
            createSidebarItem('/android/组件与机制/Handler机制详解'),
            createSidebarItem('/android/组件与机制/Binder机制详解'),
            createSidebarItem('/android/组件与机制/View详解'),
            createSidebarItem('/android/组件与机制/Window详解'),
        ],
    },
    {
        text: '主流库源码',
        items: [
            {
                text: 'Jetpack',
                items: [
                    createSidebarItem('/android/主流库源码/Jetpack/Lifecycle原理源码'),
                    createSidebarItem('/android/主流库源码/Jetpack/LiveData原理源码'),
                    createSidebarItem('/android/主流库源码/Jetpack/ViewModel原理源码'),
                    createSidebarItem('/android/主流库源码/Jetpack/Room原理源码'),
                    createSidebarItem('/android/主流库源码/Jetpack/Hilt原理源码'),
                    createSidebarItem('/android/主流库源码/Jetpack/ConstraintLayout原理源码'),
                    createSidebarItem('/android/主流库源码/Jetpack/RecyclerView原理源码'),
                    createSidebarItem('/android/主流库源码/Jetpack/ViewPager2原理源码'),
                ],
            },
            createSidebarItem('/android/主流库源码/OkHttp原理源码'),
            createSidebarItem('/android/主流库源码/Retrofit原理源码'),
            createSidebarItem('/android/主流库源码/RxJava原理源码'),
            createSidebarItem('/android/主流库源码/Glide原理源码'),
        ],
    },
    {
        text: '面试题',
        items: [
            createSidebarItem('/android/面试题/面试题'),
        ],
    },
];

export const sidebar: DefaultTheme.Sidebar = {
    '/android/': androidSidebar,
};
