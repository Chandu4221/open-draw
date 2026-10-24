import {
  listPlatformProfiles,
  listStyleProfiles,
  getStyleProfile,
} from '@open-draw/semantics';

export interface DocSettingsState extends Record<string, unknown> {
  platform: string;
  style: string;
}

export class DocSettingsController {
  readonly element: HTMLElement;
  private platformSelect: HTMLSelectElement;
  private styleSelect: HTMLSelectElement;
  private swatchesContainer: HTMLElement;
  private state: DocSettingsState = {
    platform: 'web',
    style: 'neubrutalism',
  };
  private onChangeCallback?: (state: DocSettingsState) => void;

  constructor(onChange?: (state: DocSettingsState) => void) {
    this.onChangeCallback = onChange;
    this.element = document.createElement('div');
    this.element.id = 'inspector-doc-group';
    this.element.style.cssText = 'margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;';

    const header = document.createElement('div');
    header.textContent = 'DOCUMENT SETTINGS';
    header.style.cssText = 'font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px;';
    this.element.appendChild(header);

    // Platform Picker
    const platformGroup = document.createElement('div');
    platformGroup.style.cssText = 'margin-bottom: 10px;';
    const platformLabel = document.createElement('label');
    platformLabel.htmlFor = 'inspector-platform-select';
    platformLabel.textContent = 'Target Platform';
    platformLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;';

    this.platformSelect = document.createElement('select');
    this.platformSelect.id = 'inspector-platform-select';
    this.platformSelect.setAttribute('aria-label', 'Document Platform');
    this.platformSelect.style.cssText = 'width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; background: #ffffff; cursor: pointer;';

    for (const p of listPlatformProfiles()) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.label} (${p.id})`;
      this.platformSelect.appendChild(opt);
    }
    this.platformSelect.value = this.state.platform;
    this.platformSelect.addEventListener('change', () => {
      this.state.platform = this.platformSelect.value;
      this.onChangeCallback?.(this.state);
    });
    platformGroup.appendChild(platformLabel);
    platformGroup.appendChild(this.platformSelect);
    this.element.appendChild(platformGroup);

    // Style Picker
    const styleGroup = document.createElement('div');
    styleGroup.style.cssText = 'margin-bottom: 10px;';
    const styleLabel = document.createElement('label');
    styleLabel.htmlFor = 'inspector-style-select';
    styleLabel.textContent = 'Design Style';
    styleLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;';

    this.styleSelect = document.createElement('select');
    this.styleSelect.id = 'inspector-style-select';
    this.styleSelect.setAttribute('aria-label', 'Document Style');
    this.styleSelect.style.cssText = 'width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; background: #ffffff; cursor: pointer;';

    for (const s of listStyleProfiles()) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.label} (${s.id})`;
      this.styleSelect.appendChild(opt);
    }
    this.styleSelect.value = this.state.style;
    this.styleSelect.addEventListener('change', () => {
      this.state.style = this.styleSelect.value;
      this.updateSwatches();
      this.onChangeCallback?.(this.state);
    });
    styleGroup.appendChild(styleLabel);
    styleGroup.appendChild(this.styleSelect);
    this.element.appendChild(styleGroup);

    // Swatches preview
    this.swatchesContainer = document.createElement('div');
    this.swatchesContainer.id = 'inspector-style-swatches';
    this.swatchesContainer.style.cssText = 'display: flex; gap: 6px; margin-top: 6px; align-items: center;';
    this.element.appendChild(this.swatchesContainer);
    this.updateSwatches();
  }

  getState(): DocSettingsState {
    return { ...this.state };
  }

  setState(state: Partial<DocSettingsState>): void {
    if (state.platform) {
      this.state.platform = state.platform;
      this.platformSelect.value = state.platform;
    }
    if (state.style) {
      this.state.style = state.style;
      this.styleSelect.value = state.style;
      this.updateSwatches();
    }
  }

  private updateSwatches(): void {
    this.swatchesContainer.innerHTML = '';
    const profile = getStyleProfile(this.state.style);
    if (!profile) return;
    const colors = [
      { name: 'Primary', value: profile.palette.primary },
      { name: 'Surface', value: profile.palette.surface },
      { name: 'Border', value: profile.palette.border },
      { name: 'Text', value: profile.palette.text },
    ];
    for (const c of colors) {
      const swatch = document.createElement('div');
      swatch.title = `${c.name}: ${c.value}`;
      swatch.style.cssText = `
        width: 18px; height: 18px; border-radius: 4px;
        background: ${c.value}; border: 1px solid #cbd5e1;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      `;
      this.swatchesContainer.appendChild(swatch);
    }
  }
}
