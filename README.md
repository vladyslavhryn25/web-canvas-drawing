# Canvas Drawing App

A browser drawing app built with HTML, CSS and vanilla JavaScript on the Canvas API.

## Controls

| Button | Key | Action |
| --- | --- | --- |
| **D** | `D` | Draw mode (pencil) |
| **E** | `E` | Erase mode |
| **★** | `S` | Stamp mode (bonus): click to place a star |
| **↺** | `Ctrl+Z` | Undo the last operation |
| **C** | `C` | Clean the canvas (can be undone) |

- **Size slider** sets the brush size for the pencil and eraser (and the stamp size).
- **Color picker** sets the color for the pencil and stamp.

## Run

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 5173
```

## Files

- `index.html` – layout: tool bar, size slider, color picker, canvas
- `style.css` – styles
- `script.js` – drawing, eraser, stamp, undo history and clear logic
