# Tech Spec: Система редактирования и генерации сцен Ren’Py

## 1. Назначение

Проект состоит из двух частей:

1. **Редактор сцен** (отдельное приложение)

   - Позволяет создавать и редактировать сцены для игры в визуальном виде.
   - Сохраняет данные в формате **JSON** по согласованным шаблонам.
   - Шаблон можно расширять, чтобы поддерживать новые возможности Ren’Py.

2. **Генератор** (утилита `SceneGen`)

   - Принимает на вход JSON-файл.
   - Валидирует его структуру и значения.
   - Генерирует готовые `.rpy`-файлы для использования в игре.

---

## 2. Архитектура

```
[Редактор сцен]
   ↓ (экспорт JSON)
[scene_data.json]
   ↓ (валидация + генерация)
[SceneGen]
   ↓
[.rpy файлы в /game/_gen/]
   ↓
[Ren’Py] → компиляция в .rpyc → запуск игры
```

- **Редактор** — не связан напрямую с Ren’Py, весь обмен идёт через JSON.
- **Генератор** — отдельная Python-утилита (без зависимостей), которую можно запускать вручную или в CI.
- В `.rpy`-файлы не вносятся изменения вручную — они **полностью перезаписываются** при генерации.

---

## 3. Структура JSON-сцены

Пример базового JSON (координаты относительные к `reference_resolution`):

```json
{
  "version": "1.0",
  "project": {
    "reference_resolution": { "width": 1920, "height": 1080 },
    "coords_mode": "relative"
  },
  "scenes": [
    {
      "id": "hall",
      "name": "Коридор",
      "enter_transition": { "type": "fade", "duration": 0.3 },
      "layers": [
        { "id": "bg", "type": "image", "image": "bg/hall_day.png", "zorder": 0 },
        { "id": "overlay", "type": "color", "color": "#000000", "alpha": 0.0, "zorder": 100 }
      ],
      "hotspots": [
        {
          "id": "to_classroom",
          "shape": "rect",
          "rect": { "x": 0.10, "y": 0.15, "w": 0.15, "h": 0.20 },
          "tooltip": "В класс",
          "hover_effect": { "highlight": true, "opacity": 0.12, "border": "dashed" },
          "action": { "type": "go_scene", "scene_id": "classroom", "transition": { "type": "wipeleft", "duration": 0.25 } }
        }
      ]
    }
  ]
}
```

### 3.1. Ключевые поля

- **project.reference\_resolution** — базовое разрешение, на которое нормализуются координаты.
- **coords\_mode** — `"relative"` (0–1) или `"absolute"` (пиксели).
- **scenes[].id** — уникальный идентификатор сцены.
- **layers[]** — слои отрисовки (фон, наложения, группы).
- **hotspots[]** — кликабельные области:
  - `shape`: `"rect"`, `"polygon"`, `"circle"`.
  - `action.type`:
    - `"go_scene"` → переход на другую сцену.
    - `"jump_label"` / `"call_label"` → прямой переход к label.
    - `"call_screen"` → показ экрана.
    - `"function"` → вызов Python-функции.

---

## 4. Процесс генерации `.rpy`

1. **Валидация** (`validator.py`)

   - Проверка обязательных полей.
   - Проверка типов данных.
   - Проверка диапазонов координат (для relative — 0..1).
   - Проверка уникальности `scene.id` и `layer.id`.

2. **Генерация** (`generator.py`)

   - Создание `screen scene_<id>()`:
     - Отрисовка слоёв (`add`, `Solid`, `ConditionSwitch`).
     - Хотспоты как `button` с плашкой/рамкой.
     - `tooltip` через глобальную переменную и отдельный экран.
   - Создание `label show_<id>`:
     - Установка базового фона.
     - Показ экрана сцены и тултипов.
   - Вспомогательный файл `_gen/scene_helpers.rpy`:
     - Экран `scene_tooltip_overlay`.
     - Лейбл `scene__internal__go` для `go_scene`.

---

## 5. Пример сгенерированного `.rpy`

```renpy
# _gen/scene_hall.rpy
screen scene_hall():
    zorder 10
    fixed:
        add "bg/hall_day.png" at Transform(xpos=960, ypos=540, anchor=(0.5, 0.5), zoom=1.0, rotate=0)
    # Hotspots
    button:
        xpos 192 ypos 162 xsize 288 ysize 216
        focus_mask True
        hovered SetField(store, 'scene_tooltip', _(\"В класс\")) unhovered SetField(store, 'scene_tooltip', None)
        action [SetField(store,'_next_scene','classroom'), Jump('scene__internal__go')]
        hovered:
            fixed:
                add Solid('#FFFFFF', xysize (288,26)) alpha 0.12

label show_hall:
    scene bg/hall_day.png with Fade(0.3)
    show screen scene_hall
    show screen scene_tooltip_overlay
    $ renpy.pause(0)
    return
```

---

## 6. Преимущества подхода

- **Быстрое исполнение**: всё компилируется в `.rpyc`, нет парсинга JSON на старте.
- **Простота отладки**: `renpy.lint` видит все сцены и их лейблы.
- **Чистая архитектура**: логика и контент разделены.
- **Масштабируемость**: можно расширять JSON новыми полями без переписывания ядра игры.

---

## 7. План расширений

- Поддержка **viewport/drag** для панорамных сцен.
- Настоящая обработка форм (hit-test для кругов/полигонов).
- Условная видимость слоёв и хотспотов (`visible_if`, `enabled_if`).
- Параллакс для слоёв.
- Визуальные стили хотспотов (цвет, рамка, иконки).
- Связка с другими редакторами (диалоги, предметы, интерактив).

