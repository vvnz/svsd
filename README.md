# svsd

Fridge magnet poetry. Every day you get a bank of word magnets, and you arrange them on your fridge into a small poem about your day.

Built for a designathon on the theme of storytelling.

## Run it

```bash
npm install
npm run dev
```

Then open the link it prints. On a laptop the app shows inside a phone frame; on a phone it fills the screen.

The fridge texture is a WebGPU shader exported from Figma. It shows in browsers with WebGPU and HTML-in-Canvas support; everywhere else the fridge falls back to a flat surface.
