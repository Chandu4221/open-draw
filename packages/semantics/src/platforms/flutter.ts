import type { PlatformProfile } from './types.js';

export const flutterProfile: PlatformProfile = Object.freeze({
  id: 'flutter',
  label: 'Flutter (Material 3)',
  target: 'flutter-widgets',
  breakpoints: Object.freeze([
    { id: 'compact', label: 'Compact Mobile (< 600dp)', width: 400 },
  ]),
  mappings: Object.freeze({
    page: { componentName: 'Scaffold', containerType: 'column', notes: 'Material Scaffold widget' },
    section: { componentName: 'SingleChildScrollView', containerType: 'column', notes: 'Scrollable layout section' },
    column: { componentName: 'Expanded', containerType: 'column', notes: 'Expanded Column child' },
    row: { componentName: 'Row', containerType: 'row', notes: 'Horizontal Row widget with children' },
    card: { componentName: 'Card', containerType: 'column', notes: 'Material Card widget' },
    nav: { componentName: 'AppBar', containerType: 'row', notes: 'Material AppBar' },
    heading: { componentName: 'Text', notes: 'Theme.of(context).textTheme.headlineMedium' },
    text: { componentName: 'Text', notes: 'Theme.of(context).textTheme.bodyMedium' },
    button: { componentName: 'ElevatedButton', notes: 'ElevatedButton with onPressed' },
    image: { componentName: 'Image', notes: 'Image.asset or Image.network with semanticLabel' },
    annotation: { componentName: 'Text', notes: 'Stylized annotation note widget' },
  }),
});
