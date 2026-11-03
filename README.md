# Vue Rainfall App

Vue 3 + Vite migration of the supplied `Exact.dc(2).html` reference, including its original maps, fonts, icons, station management, reading cards and notification-rule screens.

## Run

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. `npm run build` creates `dist/`; `npm run preview` serves that production build.

## Implementation

`src/App.vue` composes four Vue components. Each component keeps the original reference markup and logic in `src/components/`. `src/runtime.js` renders that markup with Vue VNodes and reactive state. It has no React dependency and does not require the original design-tool runtime. Native template elements preserve repeated table rows during parsing.

The old ChatGPT-generated ZIP was not available through the referenced chat. This runnable project was recovered directly from the supplied HTML and the matching complete export found on the user's computer.

## Data and limitations

All stations, readings, alerts, thresholds, dates and LINE settings retain the reference's demonstration data. No live sensor API, authentication service, LINE delivery or durable backend is connected. Edits are held in browser memory and reset when the page reloads. The map preserves the original image-based design and its interactive overlays; it is not a live GIS basemap.

Build and browser checks covered map display, light/dark themes, search, period selection, history charts and table rows, station management, and notification-rule navigation. The design retains the original fixed artboard scaling behavior.

## Criteria UI update
The station list, notification inbox and station details now expose a shared criteria-details dialog. Central area criteria and per-station criteria are shown independently. No station-to-criteria binding source is available, so both remain explicitly unevaluated; no threshold result or area membership is fabricated. This is a presentation update, not an assessment engine or notification-policy change. The dialog snapshots the selected station to prevent new demo alerts from changing its contents while open.


## v56 threshold mockup
The criteria UI now deliberately simulates area/station bindings using the supplied v56 default cuts: 1h 0.5/5/25/50; 24h 0.5/10/35/90; 72h 50/100/150/200 mm (Draft/TBD). The central v56 values remain the reference. The user-requested mock area override reduces every cut by 20 percent; per-station criteria retain the reference values. Each type is evaluated independently. Positive-rainfall interval upper bounds are inclusive; zero means no rain. Unsupported windows have no criteria. This replaces the earlier unconnected presentation state for rainfall only and does not create operational alerts. A 1h chart uses the existing simulated hourly series; 48h accumulation remains unavailable.


Rainfall accumulation controls now consistently use 24h, 3d, 5d, 7d and 15d in the dashboard, popup comparison, history chart and both threshold editors. Additional multi-day cuts are mock draft values only.

