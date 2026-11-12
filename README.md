# Stringroom

A responsive browser guitar built with Next.js, TypeScript, Tailwind CSS, SVG, and the native Web Audio API. Seven guitars share the same chord keys: acoustic, 12-string, classical, electric, drive (with an optional power-chord mode), bass and ukulele. You can record what you play and download it.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js, select **Enable sound**, and start playing.

## Controls

- Hold `C`, `D`, `E`, `F`, `G`, or `A` for C, Dm, Em, F, G, or Am.
- Move the mouse vertically across the strings to strum.
- On touch devices, select a chord and drag a finger across the strings.
- Press `Space` for a downward strum or `Shift` + `Space` for an upward strum.
- Use the speaker button and slider to mute or change volume.
- Switch guitars with the tabs above the neck, or link to one directly with `/?guitar=bass` (also `twelve`, `classical`, `electric`, `drive`, `ukulele`). `/guitars` lists each guitar's tuning and sound source.
- `/library` saves chord progressions (played back in the studio, strumming on each beat), a volume per guitar, a default guitar, and preferences: left-handed neck, chord key layout (letters, home row or numbers) and strum sensitivity. The library is stored in this browser's localStorage; there are no accounts yet.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Audio attribution

Samples in `public/audio/` are adapted from [nbrosowsky/tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) (CC BY 3.0): acoustic (University of Iowa Musical Instrument Samples), classical (Freesound, quartertone), electric and bass (Karoryfer Samples). The 12-string reuses the acoustic samples with octave-paired strings, Drive reuses the electric samples through an amp model; the ukulele is synthesized in the browser. Full attribution is in `public/audio/LICENSE.md`.
