import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import openapi from './openapi.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const dataDir = path.resolve(__dirname, process.env.DATA_DIR || 'data');
const scenesPath = path.join(dataDir, 'scenes.json');
const dialogsPath = path.join(dataDir, 'dialogs.json');

async function readData(filePath, key) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const initial = { schema_version: 1 };
      initial[key] = [];
      await fs.writeFile(filePath, JSON.stringify(initial, null, 2));
      return initial;
    }
    throw err;
  }
}

async function writeData(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

app.get('/scenes', async (req, res) => {
  try {
    const data = await readData(scenesPath, 'scenes');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/scenes', async (req, res) => {
  try {
    const data = await readData(scenesPath, 'scenes');
    const newScene = req.body;
    data.scenes.push(newScene);
    data.schema_version++;
    await writeData(scenesPath, data);
    res.status(201).json(newScene);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/dialogs', async (req, res) => {
  try {
    const data = await readData(dialogsPath, 'dialogs');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/dialogs', async (req, res) => {
  try {
    const data = await readData(dialogsPath, 'dialogs');
    const newDialog = req.body;
    data.dialogs.push(newDialog);
    data.schema_version++;
    await writeData(dialogsPath, data);
    res.status(201).json(newDialog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
