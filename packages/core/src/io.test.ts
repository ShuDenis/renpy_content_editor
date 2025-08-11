import { loadFileAsText, saveTextFile } from './io';

describe('file helpers', () => {
  const originalCreateElement = document.createElement;
  const originalFileReader = globalThis.FileReader;
  const originalCreateObjectURL = globalThis.URL.createObjectURL;
  const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;

  afterEach(() => {
    document.createElement = originalCreateElement;
    globalThis.FileReader = originalFileReader;
    globalThis.URL.createObjectURL = originalCreateObjectURL;
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('reads text from selected file', async () => {
    const content = 'hello world';
    const file = new File([content], 'test.txt', { type: 'text/plain' });

    const remove = vi.fn();
    const input: any = {
      type: '',
      accept: '',
      files: [file],
      onchange: null,
      click: () => input.onchange && input.onchange(),
      remove,
    };
    // @ts-ignore override
    document.createElement = vi.fn((tag: string) => (tag === 'input' ? input : originalCreateElement.call(document, tag)));

    class FR {
      result: string | ArrayBuffer | null = null;
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
      readAsText(_f: File) {
        this.result = content;
        this.onload?.call(this as unknown as FileReader, new ProgressEvent('load') as ProgressEvent<FileReader>);
      }
    }
    // @ts-ignore override
    globalThis.FileReader = FR as any;

    const text = await loadFileAsText('.txt');
    expect(text).toBe(content);
    expect(remove).toHaveBeenCalled();
  });

  it('returns null and removes element when no file selected', async () => {
    const remove = vi.fn();
    const input: any = {
      type: '',
      accept: '',
      files: [],
      onchange: null,
      click: () => input.onchange && input.onchange(),
      remove,
    };
    // @ts-ignore override
    document.createElement = vi.fn((tag: string) => (tag === 'input' ? input : originalCreateElement.call(document, tag)));

    const text = await loadFileAsText('.txt');
    expect(text).toBeNull();
    expect(remove).toHaveBeenCalled();
  });

  it('triggers download when saving text', () => {
    const click = vi.fn();
    const remove = vi.fn();
    const anchor: any = { href: '', download: '', click, remove };
    const originalCreate = document.createElement;

    // @ts-ignore
    document.createElement = vi.fn((tag: string) => (tag === 'a' ? anchor : originalCreateElement.call(document, tag)));

    const createURL = vi.fn(() => 'blob:url');
    const revokeURL = vi.fn();
    // @ts-ignore
    globalThis.URL.createObjectURL = createURL;
    // @ts-ignore
    globalThis.URL.revokeObjectURL = revokeURL;

    saveTextFile('data', 'file.txt');

    expect(createURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
    expect(revokeURL).toHaveBeenCalled();
  });
});
