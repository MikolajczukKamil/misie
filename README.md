# Misie

Hej,

Poznaj Misie, cisi pomocnicy odblokują za Ciebie twoje ulubione zasoby

## Rozszerzenie do przeglądarki
- [Chrome store](https://chrome.google.com/webstore/detail/legohcbpniehehobieiicboindhclcid)
- [Firefox Addons](https://addons.mozilla.org/pl/firefox/addon/misie)

![Zrzut ekranu](inne/zrzut-2.png)


## Wersje na Chrome i Firefox

W katalogu `src` znajduje się plik `manifest.json` będący punktem startowym dla wersji FF, odwołuje się on do plików z podkatalogu `core` które to są główną częścią rozszerzenia i miejscem startowym dla wersji `chorome`

- `/src`
  - `manifest.json` — punkt startowy dla wersji `firefox`
  - `/core`
      - `manifest.json` — punkt startowy dla wersji `chrome`
      - `...` zawartość rozszerzenia

## Debug
- chrome://extensions
- about:addons
- about:debugging#/runtime/this-firefox
