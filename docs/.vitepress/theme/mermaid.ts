import mermaid, {type MermaidConfig} from 'mermaid';

let previousConfigKey: string | null = null;

const ensureInitialized = (config: MermaidConfig) => {
    const key = JSON.stringify(config);
    if (previousConfigKey === key) {
        return;
    }
    mermaid.initialize({...config});
    previousConfigKey = key;
};

export const render = async (id: string, code: string, config: MermaidConfig): Promise<string> => {
    ensureInitialized(config);
    const {svg} = await mermaid.render(id, code);
    return svg;
};
