# Choir Sheets

<p align="center">
  <img src="assets/preview.png" alt="Choir Sheets preview" width="680">
</p>

Render solfa notation over lyrics in Obsidian. Nigerian solfa, #/b solfa, and number systems for Soprano, Alto, Tenor, and Chord parts.

Works in both **live preview** and **reading mode**. In live preview, blocks show the rendered view — click into a block to edit the raw source, then click out to see the rendering again.

## Usage

### Single-block multi-part format (recommended)

Wrap all parts in a single code block. Use `[S]` / `[A]` / `[T]` / `[C]` prefixes to mark per-part lines.

````
```choir
[Verse]
C          G7         Am         F
Here comes the   sun     and   we   sing   a  long
[S] d  r  m  f  |  s  l  t  d'
[A] l  t  d' r' |  d' t  l  t
[T] s  s  d  d  |  m  s  t  d
```
````

- **Lyrics** are written once, shared by all parts.
- **[S]** / **[A]** / **[T]** prefixes mark solfa lines for each part.
- **[C]** prefix marks chord symbol lines (chords render above lyrics in italic).

### Separate-block format (legacy)

Each part in its own code block with a suffix:

````
```choir-soprano
d  r  m  f  |  s  l  t  d'
Here comes   the   sun     and   we   sing   a  long
```

```choir-alto
l  t  d' r' |  d' t  l  t
Here comes   the   sun     and   we   sing   a  long
```
````

The language prefix is configurable via the `Block language specifier` setting.

## Part Tabs

When multiple parts/consecutive blocks exist, each part gets a tab:

- **Click a tab** to toggle its visibility.
- **All tabs active** (default): combined view — chords, shared lyrics, and all parts' solfa stacked with color-coded rows.
- **Single tab active**: solo view for that part.
- Cmd/Ctrl-click or just click to toggle individual parts on/off.

## Notation Systems

Set in settings. Serves as a guide for the parser — you write in one system, it renders as-is.

| Natural | Nigerian | #/b Solfa | Number |
|---------|----------|-----------|--------|
| C       | d        | d         | 1      |
| C#/Db   | di       | #d        | #1     |
| D       | r        | r         | 2      |
| D#/Eb   | mo       | bm        | b3     |
| E       | m        | m         | 3      |
| F       | f        | f         | 4      |
| F#/Gb   | fe       | #f        | #4     |
| G       | s        | s         | 5      |
| G#/Ab   | se       | #s        | #5     |
| A       | l        | l         | 6      |
| A#/Bb   | toh      | bt        | b7     |
| B       | t        | t         | 7      |
| C'      | d'       | d'        | 1'     |

Rests: `z` or `-`

## Settings

### Part Colors
| Setting | Default |
|---------|---------|
| Soprano color | `#3b82f6` (blue) |
| Alto color | `#ef4444` (red) |
| Tenor color | `#f59e0b` (amber) |
| Chord color | `#10b981` (emerald) |

### Display Colors
| Setting | Default |
|---------|---------|
| Section background | `#1e1e2e` |
| Header background | `#2a2a3e` |
| Header text | `#3b82f6` |
| Active tab background | `#2a2a3e` |

### Other
- Default part, Notation system, Block language specifier
- Highlight toggles: Solfa notes, Section headers

## Install

1. Run `npm run build` to produce the production build in `build/`
2. Copy `build/main.js`, `build/styles.css`, `build/manifest.json` to `.obsidian/plugins/choir-sheets/` in your vault

**Development install (symlink):**
```bash
ln -s "$(pwd)/build" /path/to/vault/.obsidian/plugins/choir-sheets
```
Then `npm run build` updates the plugin in place — reload Obsidian to see changes.
