# Guitar sample attribution

The audio files in this directory are adapted from
[nbrosowsky/tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments).
The collection's samples are licensed under Creative Commons Attribution 3.0
(CC BY 3.0, https://creativecommons.org/licenses/by/3.0/). Collection and
processing (trimming, volume matching, normalising, noise removal) by the
`tonejs-instruments` contributors. Original sources are listed in that
project's `sample-source-info.txt`.

| Folder       | tonejs-instruments set | Original source                                                     | Files |
| ------------ | ---------------------- | ------------------------------------------------------------------- | ----- |
| `acoustic/`  | `guitar-acoustic`      | University of Iowa Musical Instrument Samples                       | E2, A2, D3, G3, A3, C4, E4, A4 |
| `classical/` | `guitar-nylon`         | Freesound — 11573 by quartertone, "classicalguitar-multisampled"    | E2, A2, D3, G3, B3, E4, A4 |
| `electric/`  | `guitar-electric`      | Karoryfer Samples                                                   | E2, A2, C3, D♯3, F♯3, A3, C4, D♯4, F♯4, A4 |
| `bass/`      | `bass-electric`        | Karoryfer Samples                                                   | E1, G1, A♯1, C♯2, E2, G2, A♯2 |

The 12-string reuses the `acoustic/` samples, playing each string with its
octave or unison partner. The Drive guitar reuses the `electric/` samples through a distortion and
cabinet-filter chain. The ukulele has no sample set: it is synthesized in the
browser with the Karplus–Strong plucked-string algorithm.
