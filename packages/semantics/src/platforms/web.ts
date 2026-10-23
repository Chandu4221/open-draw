import type { PlatformProfile } from './types.js';

export const webProfile: PlatformProfile = Object.freeze({
  id: 'web',
  label: 'Web (React & HTML5)',
  target: 'react-tailwind',
  mappings: Object.freeze({
    page: { componentName: 'main', containerType: 'flex', notes: 'Top-level semantic container' },
    section: { componentName: 'section', containerType: 'column', notes: 'Vertical layout landmark' },
    column: { componentName: 'div', containerType: 'column', notes: 'Flex child with width fractions' },
    card: { componentName: 'article', containerType: 'column', notes: 'Surface with border and padding' },
    nav: { componentName: 'nav', containerType: 'row', notes: 'Accessible landmark header' },
    heading: { componentName: 'h2', notes: 'Semantic heading element' },
    text: { componentName: 'p', notes: 'Standard typography paragraph' },
    button: { componentName: 'button', notes: 'Interactive action element' },
    image: { componentName: 'img', notes: 'Image with mandatory alt attribute' },
    annotation: { componentName: 'aside', notes: 'Accessible secondary note' },
  }),
});
