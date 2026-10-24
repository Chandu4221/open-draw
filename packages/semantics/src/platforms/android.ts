import type { PlatformProfile } from './types.js';

export const androidProfile: PlatformProfile = Object.freeze({
  id: 'android',
  label: 'Android (Jetpack Compose)',
  target: 'jetpack-compose',
  breakpoints: Object.freeze([
    { id: 'compact', label: 'Compact Phone (< 600dp)', width: 400 },
  ]),
  mappings: Object.freeze({
    page: { componentName: 'Scaffold', containerType: 'column', notes: 'Material 3 Scaffold root' },
    section: { componentName: 'Column', containerType: 'column', notes: 'Scrollable Column (verticalScroll) or LazyColumn for lists' },
    column: { componentName: 'Column', containerType: 'column', notes: 'Nested weight-based Column' },
    row: { componentName: 'Row', containerType: 'row', notes: 'Horizontal Row arrangement with alignment' },
    card: { componentName: 'Card', containerType: 'column', notes: 'ElevatedCard or OutlinedCard' },
    nav: { componentName: 'TopAppBar', containerType: 'row', notes: 'Material TopAppBar' },
    heading: { componentName: 'Text', notes: 'MaterialTheme.typography.headlineMedium' },
    text: { componentName: 'Text', notes: 'MaterialTheme.typography.bodyMedium' },
    button: { componentName: 'Button', notes: 'Button or ElevatedButton with onClick' },
    image: { componentName: 'Image', notes: 'AsyncImage or Image with contentDescription' },
    annotation: { componentName: 'Text', notes: 'Informational note composable' },
  }),
});
