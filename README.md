# Community Hub

Minimaler Scaffold für den Community Hub auf GitHub Pages.

## Setup
1. GitHub Pages für das Repository aktivieren (Branch `main`, Ordner `/`).
2. Änderungen deployen – Pages lädt `index.html` als Einstiegspunkt.
3. Bei Anpassungen am Service Worker die Konstante `CACHE_VERSION` in `sw.js` erhöhen, um veraltete Assets zu ersetzen.

## Entwicklung
- Keine Build-Tools notwendig: statische HTML/CSS/JS-Dateien.
- Routing basiert auf URL-Hashes (`#/home`, `#/events`, ...).
- Themes werden lokal gespeichert und beim nächsten Besuch wiederhergestellt.

## Nächste Schritte
- Inhalte und Komponenten für Events, Kalender und Admin-Bereich ergänzen.
- Manifest mit Icons und Splashscreens erweitern.
- Offline-Fallback verfeinern und zusätzliche Seiten cachen.
- Lighthouse-Optimierungen für Performance, PWA und SEO durchführen.
