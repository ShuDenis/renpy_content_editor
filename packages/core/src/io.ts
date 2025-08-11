export function loadFileAsText(accept = '*'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        input.remove();
        return resolve(null);
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve(String(reader.result));
        input.remove();
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export function saveTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
