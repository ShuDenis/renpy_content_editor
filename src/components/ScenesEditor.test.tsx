import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScenesEditor from './ScenesEditor';
import { loadFileAsText, saveTextFile } from '@lib/utils';

// mock utils
vi.mock('@lib/utils', async () => {
  const actual = await vi.importActual<any>('@lib/utils');
  return {
    ...actual,
    loadFileAsText: vi.fn(),
    saveTextFile: vi.fn(),
  };
});

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
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(sampleProject)),
    }) as any);
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

  it('adds hotspots via panel', async () => {
    const { getByText, getAllByRole } = render(<ScenesEditor />);
    await waitFor(() => getByText('Загружен samples/scenes.json'));
    fireEvent.click(getByText('+ Rect'));
    await waitFor(() => getByText('Новый хотспот'));
    fireEvent.click(getByText('+ Polygon'));
    await waitFor(() => getByText('Новый полигон'));
    fireEvent.click(getByText('+ Circle'));
    await waitFor(() => getByText('Новый круг'));
    expect(getAllByRole('button', { name: /Новый/ })).toHaveLength(3);
  });

  it('updates hotspot coordinates on drag', async () => {
    const { container, getByText, getByLabelText } = render(<ScenesEditor />);
    await waitFor(() => getByText('Загружен samples/scenes.json'));
    fireEvent.click(getByText('+ Rect'));
    const canvas = container.querySelector('canvas')!;
    fireEvent.mouseDown(canvas, { clientX: 15, clientY: 15 });
    await waitFor(() => expect((getByLabelText('X') as HTMLInputElement).value).toBe('0.1'));
    fireEvent.mouseMove(canvas, { clientX: 25, clientY: 25 });
    fireEvent.mouseUp(canvas);
    await waitFor(() => expect(parseFloat((getByLabelText('X') as HTMLInputElement).value)).toBeCloseTo(0.2));
  });
});
