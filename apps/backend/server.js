import express from 'express';
import fs from 'fs';
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

function readData(filePath, key) {
  if (!fs.existsSync(filePath)) {
    const initial = { schema_version: 1 };
    initial[key] = [];
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

app.get('/scenes', (req, res) => {
  const data = readData(scenesPath, 'scenes');
  res.json(data);
});

app.post('/scenes', (req, res) => {
  const data = readData(scenesPath, 'scenes');
  const newScene = req.body;
  data.scenes.push(newScene);
  data.schema_version++;
  writeData(scenesPath, data);
  res.status(201).json(newScene);
});

app.get('/dialogs', (req, res) => {
  const data = readData(dialogsPath, 'dialogs');
  res.json(data);
});

app.post('/dialogs', (req, res) => {
  const data = readData(dialogsPath, 'dialogs');
  const newDialog = req.body;
  data.dialogs.push(newDialog);
  data.schema_version++;
  writeData(dialogsPath, data);
  res.status(201).json(newDialog);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
