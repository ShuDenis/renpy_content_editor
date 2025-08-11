# Ren'Py Content Editor (Browser MVP)

Браузерный редактор для настройки **сцен** и создания **деревьев диалогов**. Экспортирует данные в JSON, совместимые с генераторами `.rpy`.

## Цели
- Визуально редактировать сцены (слои, хотспоты).
- Визуально редактировать ветвящиеся диалоги (узлы и переходы).
- Экспорт/импорт JSON с валидацией (Zod + JSON Schema).
- В будущем — перенос ядра на Python без переписывания схем (JSON Schema как контракт).

## Быстрый старт
```bash
# 1) Установка зависимостей
npm i

# 2) Запуск дев-сервера
npm run dev

# 3) Сборка
npm run build && npm run preview
```

## Архитектура
- **/packages/core/src/** — типы и схемы (Zod), утилиты импорта/экспорта.
- **/src/components/** — ScenesEditor (канвас с хотспотами), DialogEditor (граф на React Flow).
- **/schema/** — JSON Schema для сцен/диалогов (используемо из Python).
- **/samples/** — примеры JSON (подгружаются в редактор для старта).
- **/docs/** — тех. спецификация и гайд по контрибьютингу.
- **/scripts/** — скрипты инициализации git и т.п.

## Экспорт
- **Сцены:** файл `scenes.json` — структура совместима с текущим SceneGen. Основано на предоставленном примере.
- **Диалоги:** файл `dialogs.json` — минимальная схема для MVP, расширяемая под будущий `DialogGen`.

## Git
Инициализация репозитория и создание ветки `develop` (Linux/macOS):
```bash
bash scripts/git_bootstrap.sh https://github.com/<you>/<repo>.git
```
Windows (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/git_bootstrap.ps1 -Remote "https://github.com/<you>/<repo>.git"
```

## Источники требований
- Пример JSON для сцен: см. `samples/scenes.json`.
- Tech Spec по сценам и генерации `.rpy`: см. `docs/tech-spec.md`.
- Майлстоуны редактора: см. `docs/milestones.md`.
- Контрибьютинг и ветвление: см. `docs/CONTRIBUTING.md`.

Лицензия: по договорённости с заказчиком.
