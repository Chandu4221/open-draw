import type { CanvasEditor } from '@open-draw/canvas';

export interface PopupController {
  getCurrentColor: () => string;
  setCurrentColor: (color: string) => void;
  closeAll: () => void;
}

export function initPopups(
  editor: CanvasEditor,
  onColorChange: (color: string) => void
): PopupController {
  let currentColor = '#3b82f6';
  let activeShape = 'rect';

  const popupShapes = document.getElementById('popup-shapes') as HTMLElement | null;
  const popupColors = document.getElementById('popup-colors') as HTMLElement | null;
  const btnToggleShapes = document.getElementById('btn-toggle-shapes') as HTMLButtonElement | null;
  const btnToggleColors = document.getElementById('btn-toggle-colors') as HTMLButtonElement | null;
  const toolActiveShape = document.getElementById('tool-active-shape') as HTMLButtonElement | null;
  const activeShapeIcon = document.getElementById('active-shape-icon') as HTMLElement | null;
  const activeColorDot = document.getElementById('active-color-dot') as HTMLElement | null;

  function closeAll(): void {
    if (popupShapes) popupShapes.classList.add('hidden');
    if (popupColors) popupColors.classList.add('hidden');
    btnToggleShapes?.classList.remove('active');
    btnToggleColors?.classList.remove('active');
  }

  function positionPopup(popup: HTMLElement, trigger: HTMLElement): void {
    popup.classList.remove('hidden');
    const triggerRect = trigger.getBoundingClientRect();
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    const popupWidth = popup.offsetWidth || 240;
    const clampedLeft = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, triggerCenter - popupWidth / 2));
    popup.style.left = `${clampedLeft}px`;
    popup.style.bottom = `${window.innerHeight - triggerRect.top + 8}px`;
  }

  function togglePopup(popup: HTMLElement | null, trigger: HTMLElement | null): void {
    if (!popup || !trigger) return;
    const isCurrentlyOpen = !popup.classList.contains('hidden');
    closeAll();
    if (!isCurrentlyOpen) {
      positionPopup(popup, trigger);
      trigger.classList.add('active');
    }
  }

  btnToggleShapes?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopup(popupShapes, btnToggleShapes);
  });

  btnToggleColors?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePopup(popupColors, btnToggleColors);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-popup-tool]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tool = btn.getAttribute('data-popup-tool');
      const icon = btn.getAttribute('data-icon');
      if (!tool) return;

      activeShape = tool;
      if (toolActiveShape) {
        toolActiveShape.setAttribute('data-tool', tool);
        toolActiveShape.title = `${btn.textContent?.trim() || tool} (${tool.charAt(0).toUpperCase()})`;
      }
      if (activeShapeIcon && icon) {
        activeShapeIcon.textContent = icon;
      }

      document.querySelectorAll('[data-popup-tool]').forEach((item) => {
        item.classList.toggle('active', item.getAttribute('data-popup-tool') === tool);
      });

      editor.setTool(tool);
      closeAll();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-popup-color]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const color = btn.getAttribute('data-popup-color');
      if (!color) return;

      currentColor = color;
      if (activeColorDot) {
        activeColorDot.style.background = color;
      }

      document.querySelectorAll('[data-popup-color]').forEach((item) => {
        item.classList.toggle('active', item.getAttribute('data-popup-color') === color);
      });

      onColorChange(color);
      closeAll();
    });
  });

  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (
      !target?.closest('#popup-shapes') &&
      !target?.closest('#popup-colors') &&
      !target?.closest('#btn-toggle-shapes') &&
      !target?.closest('#btn-toggle-colors')
    ) {
      closeAll();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  window.addEventListener('resize', () => {
    if (popupShapes && !popupShapes.classList.contains('hidden') && btnToggleShapes) {
      positionPopup(popupShapes, btnToggleShapes);
    }
    if (popupColors && !popupColors.classList.contains('hidden') && btnToggleColors) {
      positionPopup(popupColors, btnToggleColors);
    }
  });

  return {
    getCurrentColor: () => currentColor,
    setCurrentColor: (color: string) => {
      currentColor = color;
      if (activeColorDot) activeColorDot.style.background = color;
      document.querySelectorAll('[data-popup-color]').forEach((item) => {
        item.classList.toggle('active', item.getAttribute('data-popup-color') === color);
      });
    },
    closeAll,
  };
}
