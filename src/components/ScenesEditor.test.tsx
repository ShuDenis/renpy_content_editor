import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@lib/utils', async () => {
  const actual = await vi.importActual<any>('@lib/utils');
  return {
    ...actual,
    loadFileAsText: vi.fn(),
    saveTextFile: vi.fn(),
  };
});

import ScenesEditor from './ScenesEditor';
import { loadFileAsText, saveTextFile } from '@lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// ЧАСТЬ 1: тест клонирования хотспота (structuredClone)
// (без импорта типов из @lib/sceneSchema, чтобы не ломать сборку)
// ─────────────────────────────────────────────────────────────────────────────
type THotspot = {
  id: string;
  shape: 'rect' | 'polygon' | 'circle';
  rect?: { x: number; y: number; w: number; h: number };
  tooltip?: string | undefined;
  // допускаем любые доп. поля
  [key: string]: any;
};

describe('ScenesEditor hotspot cloning', () => {
  it('preserves undefined and Date properties', () => {
    const original: THotspot & { created: Date } = {
      id: 'hs1',
      shape: 'rect',
      hidden: false,
      rect: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 },
      tooltip: undefined,
      created: new Date('2024-06-01T00:00:00Z'),
    };
    const copy = structuredClone(original);
    expect(copy).not.toBe(original);
    expect('tooltip' in copy).toBe(true);
    expect(copy.tooltip).toBeUndefined();
    expect(copy.created).toBeInstanceOf(Date);
    expect(copy.created.getTime()).toBe(original.created.getTime());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ЧАСТЬ 2: тесты компонента ScenesEditor (импорт/экспорт и добавление хотспота)
// ─────────────────────────────────────────────────────────────────────────────

const sampleProject = {
  version: '1.0',
  project: { reference_resolution: { width: 100, height: 100 }, coords_mode: 'relative' },
  scenes: [{ id: 's1', hotspots: [] }],
};

function mockCanvas() {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ({
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      translate: vi.fn(),
      clearRect: vi.fn(),
      strokeStyle: '',
      fillStyle: '',
      globalAlpha: 1,
      lineWidth: 1,
    }),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0 }),
  });
}

describe('ScenesEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvas();
    localStorage.clear();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(sampleProject)),
      } as any),
    ) as any;
  });

  it('imports and exports JSON', async () => {
    (loadFileAsText as any).mockResolvedValue(JSON.stringify(sampleProject));
    const { getByText } = render(<ScenesEditor />);
    await waitFor(() => getByText('Загружен samples/scenes.json'));
    fireEvent.click(getByText('Импорт JSON'));
    await waitFor(() => expect(loadFileAsText).toHaveBeenCalled());
    await waitFor(() => getByText('Импорт JSON выполнен'));
    fireEvent.click(getByText('Экспорт JSON'));
    await waitFor(() => expect(saveTextFile).toHaveBeenCalled());
    await waitFor(() => getByText('Экспортировано scenes.json'));
  });

  it('adds rect hotspot via panel (matches current UI)', async () => {
    const { getByText } = render(<ScenesEditor />);
    await waitFor(() => getByText('Загружен samples/scenes.json'));
    fireEvent.click(getByText('+ Rect'));
    await waitFor(() => getByText('Добавлен прямоугольный хотспот'));
  });

  it.skip('updates hotspot coordinates on drag (not implemented in MVP)', async () => {
    // Отключено: текущий MVP не поддерживает drag/resize хотспотов и поля X/Y.
    // Когда добавим drag’n’drop — вернём тест.
  });
});

