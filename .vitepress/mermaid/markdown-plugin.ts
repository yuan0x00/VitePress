import type {MarkdownRenderer} from 'vitepress';

export const setupMermaidMarkdown = (md: MarkdownRenderer) => {
    const defaultRenderer = md.renderer.rules.fence;

    if (!defaultRenderer) {
        throw new Error('defaultRenderer is undefined');
    }

    const {escapeHtml} = md.utils;

    const buildCustomBlock = (type: 'warning' | 'note', title: string, content: string) => {
        const escaped = escapeHtml(content.trim());
        const paragraphs = escaped
            .split(/\n{2,}/)
            .filter(Boolean)
            .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
            .join('');
        return `<div class="${type === 'warning' ? 'warning' : 'tip'} custom-block"><p class="custom-block-title">${title}</p>${paragraphs}</div>`;
    };

    md.renderer.rules.fence = (tokens, index, options, env, slf) => {
        const token = tokens[index];
        const language = token.info.trim();
        if (language.startsWith('mermaid')) {
            return `<Mermaid id="mermaid-${index}" graph="${encodeURIComponent(token.content)}" />`;
        } else if (language === 'warning') {
            return buildCustomBlock('warning', 'WARNING', token.content);
        } else if (language === 'note') {
            return buildCustomBlock('note', 'NOTE', token.content);
        } else if (language === 'regexp') {
            // shiki doesn't yet support regexp code blocks, but the javascript
            // one still makes RegExes look good
            token.info = 'javascript';
            // use trimEnd to move trailing `\n` outside if the JavaScript regex `/` block
            token.content = `/${token.content.trimEnd()}/\n`;
            return defaultRenderer(tokens, index, options, env, slf);
        } else if (language === 'jison') {
            return `<div class="language-">
      <button class="copy"></button>
      <span class="lang">jison</span>
      <pre>
      <code>${token.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
      </pre>
      </div>`;
        }

        return defaultRenderer(tokens, index, options, env, slf);
    };
};
