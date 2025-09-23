import mermaid, {type MermaidConfig} from 'mermaid';

export interface MermaidRendererOptions {
    /**
     * 默认配置，可在实例化后通过 `setDefaultConfig` 更新
     */
    defaultConfig?: MermaidConfig;
    /**
     * 是否默认对传入的代码执行 decodeURIComponent
     */
    autoDecode?: boolean;
}

export interface MermaidRenderParams {
    id: string;
    code: string;
    config?: MermaidConfig;
    decode?: boolean;
}

export interface MermaidRenderer {
    render: (params: MermaidRenderParams) => Promise<string>;
    reset: (config?: MermaidConfig) => void;
    setDefaultConfig: (config: MermaidConfig) => void;
}

const createMermaidInitializer = () => {
    let previousConfigKey: string | null = null;

    return (config: MermaidConfig) => {
        const key = JSON.stringify(config);
        if (previousConfigKey === key) {
            return;
        }
        mermaid.initialize({...config});
        previousConfigKey = key;
    };
};

export const createMermaidRenderer = (
    options: MermaidRendererOptions = {}
): MermaidRenderer => {
    let defaultConfig = options.defaultConfig;
    let ensureInitialized = createMermaidInitializer();

    const getConfig = (incoming?: MermaidConfig) => {
        if (incoming) {
            return incoming;
        }
        if (defaultConfig) {
            return defaultConfig;
        }
        throw new Error('Mermaid 渲染需要提供配置参数');
    };

    return {
        async render({id, code, config, decode}: MermaidRenderParams) {
            const targetConfig = getConfig(config);
            ensureInitialized(targetConfig);
            const shouldDecode = decode ?? options.autoDecode ?? false;
            const source = shouldDecode ? decodeURIComponent(code) : code;
            const {svg} = await mermaid.render(id, source);
            return svg;
        },
        reset(newConfig?: MermaidConfig) {
            if (newConfig) {
                defaultConfig = newConfig;
            }
            ensureInitialized = createMermaidInitializer();
            if (defaultConfig) {
                ensureInitialized(defaultConfig);
            }
        },
        setDefaultConfig(config: MermaidConfig) {
            defaultConfig = config;
            ensureInitialized(config);
        },
    };
};

const singletonRenderer = createMermaidRenderer();

export const render = async (id: string, code: string, config: MermaidConfig): Promise<string> => {
    return singletonRenderer.render({id, code, config});
};
