import type { PlatformProfile } from './types.js';

export const androidProfile: PlatformProfile = Object.freeze({
  id: 'android',
  label: 'Android (Jetpack Compose)',
  target: 'jetpack-compose',
  mappings: Object.freeze({
    page: { componentName: 'Scaffold', containerType: 'column', notes: 'Material 3 Scaffold root' },
    section: { componentName: 'Column', containerType: 'column', notes: 'Scrollable Column or LazyColumn' },
    column: { componentName: 'Column', containerType: 'column', notes: 'Nested weight-based Column' },
    card: { componentName: 'Card', containerType: 'column', notes: 'ElevatedCard or OutlinedCard' },
    nav: { componentName: 'TopAppBar', containerType: 'row', notes: 'Material TopAppBar' },
    heading: { componentName: 'Text', notes: 'MaterialTheme.typography.headlineMedium' },
    text: { componentName: 'Text', notes: 'MaterialTheme.typography.bodyMedium' },
    button: { componentName: 'Button', notes: 'Material Button with onClick' },
    image: { componentName: 'Image', notes: 'AsyncImage or Image with contentDescription' },
    annotation: { componentName: 'Text', notes: 'Informational note composable' },
  }),
});
