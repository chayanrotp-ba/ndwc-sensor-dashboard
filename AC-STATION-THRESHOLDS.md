# Station threshold AC implementation (local prototype)

- Entry: Backoffice station row actions > threshold settings; name/code search and basin/status filters remain available.
- Header includes code, station name, owning agency, location and Default/Custom warning status.
- Separate ThaiWater read-only rainfall intensity and editable Warning DDPM tabs. ThaiWater never enters the warning evaluator.
- Warning names/colors read Master localStorage records in reverse display order (low to high). No rename/add/delete in station editor. Changed Master IDs block evaluation until reconciled rather than guessing a mapping.
- Warning supports hourly, today (07:00 to now), yesterday/24h and 3-day windows. Today is independent. Existing legacy rainfall settings are retained separately; no implicit migration of intensity settings into warning settings.
- All warning periods must have finite positive strictly ascending upper bounds; upper bounds belong only to the lower band. Save/reset target one station. Reset follows latest central warning data.
- canManage=false blocks editor controls and save/reset; station.hasRain=false blocks rainfall settings. Current demonstration stations are rainfall stations under the prototype super-admin.
- Persistence failures do not update reactive state. Missing/corrupt criteria and changed Master show an error. Saved status remains visible without closing editor.

## Integration boundaries

Warning central numeric values remain explicitly labeled demonstration data, not an approved DDPM standard. Master currently contains six rain labels (including duplicate rain-heavy names); preserve those records instead of inventing approved warning labels. ThaiWater multi-day values remain draft.

This repository has no backend authentication/authorization or live alert delivery pipeline. canManage is a UI integration contract, not a security boundary. evaluateWarning provides the isolated effective DDPM classification; wiring it into a real trigger pipeline and server-side authorization remains backend work. Legacy map/popup intensity comparisons retain their existing store and are not the new Warning evaluator.

## Validation

Build and Node tests cover boundary ownership, isolated station updates, reset following central changes, independent today window, permissions, bad numbers, Master mismatch and storage failure. Browser verification succeeded on port 5175 after restarting the server: edit/save changed only the selected station to Custom; Reset confirmation restored Default and original bounds; ThaiWater tab exposed no edit/save actions. Responsive breakpoints have not been re-tested for this change.
