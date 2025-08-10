# JSON Templates Guide

This folder contains reference templates for the JSON formats supported by `make_renpy_script_from_json`. Use it as a working document when updating or reviewing content.

## Dialogue Template

Top-level structure:

```json
{
  "version": "1.0",
  "project": {
    "language": "ru",
    "default_character": "narrator",
    "naming": { "label_prefix": "dlg_", "menu_prefix": "m_" }
  },
  "dialog_trees": [
    {
      "id": "day1_intro",
      "title": "День 1 — вступление",
      "entry_node": "n_start",
      "locals": [{ "name": "mood", "type": "str", "default": "neutral" }],
      "using_characters": ["narrator", "e"],
      "nodes": [
        {
          "id": "n_start",
          "type": "say",
          "character": "e",
          "text": "Привет! Сегодня начнём.",
          "text_tags": ["b"],
          "voice": "voice/day1_001.ogg",
          "auto_advance": false,
          "next": "n_choice_1"
        },
        {
          "id": "n_choice_1",
          "type": "choice",
          "prompt": "Как ответить?",
          "choices": [
            {
              "id": "c_ask",
              "text": "Спросить про курс",
              "conditions": ["points >= 0"],
              "effects": ["interest = 'course'"],
              "next": "n_course"
            },
            {
              "id": "c_silent",
              "text": "Промолчать",
              "next": "n_gate"
            }
          ]
        },
        {
          "id": "n_gate",
          "type": "if",
          "branches": [
            { "condition": "mood == 'happy'", "next": "n_happy" },
            { "condition": "True", "next": "n_neutral" }
          ]
        },
        { "id": "n_happy", "type": "say", "character": "e", "text": "Классное настроение!", "next": "n_ret" },
        { "id": "n_neutral", "type": "say", "character": "e", "text": "Окей, продолжим.", "next": "n_ret" },
        { "id": "n_ret", "type": "return" }
      ]
    }
  ]
}
```

Explanation:

* `version` – format version.
* `project` – global project settings:
  * `language` – ISO language code.
  * `default_character` – used when a node omits `character`.
  * `naming` – prefixes for generated labels and menus.
* `dialog_trees` – list of dialogue graphs.
  * `id` – stable identifier for the tree.
  * `title` – human‑readable name for editors.
  * `entry_node` – starting node id.
  * `locals` – local variables with `name`, `type` and `default`.
  * `using_characters` – characters participating in the tree.
  * `nodes` – ordered collection of nodes. Common fields: `id`, `type`, optional `comment`, `tags`.
    * `say` node: `character`, `text`, optional `text_tags`, `voice`, `auto_advance`, `next`.
    * `choice` node: `prompt`, `choices` array of options with `id`, `text`, optional `conditions`, `effects`, `next`.
    * `if` node: `branches` array of `{condition, next}` pairs.
    * `return` node ends the dialogue. Other node types like `script`, `jump` and `call` follow the tech spec.

## Scenes Template

Top-level structure:

```json
{
  "version": "1.0",
  "project": {
    "reference_resolution": {"width": 1920, "height": 1080},
    "coords_mode": "relative"
  },
  "scenes": [
    {
      "id": "hall",
      "name": "Коридор",
      "enter_transition": {"type": "fade", "duration": 0.3},
      "layers": [
        {"id": "bg", "type": "image", "image": "bg/hall_day.png", "zorder": 0},
        {"id": "overlay", "type": "color", "color": "#000000", "alpha": 0.0, "zorder": 100}
      ],
      "hotspots": [
        {
          "id": "to_classroom",
          "shape": "rect",
          "rect": {"x": 0.1, "y": 0.15, "w": 0.15, "h": 0.2},
          "tooltip": "В класс",
          "hover_effect": {"highlight": true, "opacity": 0.12, "border": "dashed"},
          "action": {
            "type": "go_scene",
            "scene_id": "classroom",
            "transition": {"type": "wipeleft", "duration": 0.25}
          }
        }
      ]
    }
  ]
}
```

Explanation:

* `version` – template version string.
* `project` – common settings:
  * `reference_resolution` – base width and height used for coordinate conversion.
  * `coords_mode` – `"relative"` (0–1 range) or `"absolute"` (pixel coordinates).
* `scenes` – list of scene objects.
  * `id` – unique identifier used for screen and label names.
  * `name` – optional human‑readable title.
  * `enter_transition` – optional transition when entering the scene.
  * `layers` – ordered visual elements. Each layer has:
    * `id`, `type` (`image`, `color`, `group`), `zorder`.
    * For `image` layers: `image` path; optional `variants` for condition‑based switches.
    * For `color` layers: `color` hex value and `alpha` opacity.
    * For `group` layers: `children` list with nested layers.
  * `hotspots` – interactive regions:
    * `shape` – `rect`, `polygon`, or `circle` with corresponding coordinates.
    * Optional `tooltip` text and `hover_effect` style.
    * `action` – behaviour on click:
      * `go_scene` with `scene_id` and optional `transition`.
      * `jump_label` or `call_label` with `label`.
      * `call_screen` with `screen` name and optional `params`.
      * `function` with Python `name` and optional `args`/`kwargs`.

Use this document as a basis for discussing and updating the template formats.

