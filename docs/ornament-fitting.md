# Ornament fitting

The fit is now computed in source-image pixels. The photo, jewelry and pointer input share one aspect-preserving `contain` transform. Changing the stage size or adding padding to a photo no longer changes the ornament's relationship to the person.

## Corrections

- Removed the vertical coordinate mismatch between independently normalized landmarks and the Three.js camera.
- Removed the fixed second-earring offset. Each earring has its own lower-face-contour attachment; resizing changes the jewelry without moving its attachment away from the ear.
- Trimmed transparent studio padding before applying product dimensions. Earrings use the catalog dimensions and a 63 mm interpupillary-distance **prior**. This is not a measured distance for the customer.
- Placed the upper neckwear attachment below the chin. Choker width is constrained by face-relative neck width; necklaces use their product dimensions for width.
- Placed rings on the proximal ring-finger segment and oriented the band across that segment using pixel-space angles.
- Oriented bangles across the wrist and refined their width using two local color boundaries when both boundaries are unambiguous. No skin-tone constant or training set is used; ambiguous boundaries retain the anatomical estimate.
- Replaced edge-on generic toruses and the floating sphere with front-facing, curved band surfaces and an attached faceted setting. The hidden rear half of the band is omitted.
- Made renderer updates atomic, rejected stale async renders, disposed old geometry/materials and cached ornament textures.
- Fixed drag offsets, aspect-correct pinch rotation, automatic-fit reset and the original-photo comparison overlay.

## Photo calibration

Open **Fit controls → Set two fit points**.

- Earrings: select both earlobes. Each earring moves to the corresponding point.
- Rings/bangles: select the two finger/wrist edges at the intended wearing position. The points determine the band's center, width and orientation.
- Chokers/necklaces: select the two sides of the neck at the intended top of the ornament. The points determine its width, top attachment and orientation.

The ordinary size, position, opacity and rotation controls remain available. Reset clears the category's calibration and restores the automatic fit. Calibration is scoped to the current photo and category; a new photo clears it. Live mode uses fresh landmark fits and suppresses jewelry after tracking loss.

## Accuracy boundaries

MediaPipe Face Mesh does not supply earlobe or neck measurements. Those automatic placements are anatomical estimates; use the two-point control for a specific person's attachment points. [MediaPipe describes its screen coordinates and metric reconstruction separately](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/face_mesh.md).

The existing catalog labels its dimensions as estimated. A physical-size guarantee needs measured product dimensions and a measured customer scale reference. Retail product measurements are useful validation references: for example, [Tanishq lists a bell jhumka at 5.4 cm high and 2.3 cm wide](https://www.tanishq.co.in/product/bell-motif-gold-jhumka-earrings-51w2a1jdmabap3.html?lang=en_IN). Those measurements were not substituted for this app's different products. No retailer images were used as a training dataset.

The procedural ring and bangle are style previews, not digitizations of the catalog photograph. Exact ornament identity needs calibrated product meshes or suitable wearing-view assets. Face textures also do not perform hair/ear occlusion, remove pre-existing jewelry, or reconstruct arbitrary out-of-plane poses. The controls label the fit as estimated.

## Verification

- `npm test`: 24 regression cases covering source/viewport transforms, aspect changes, translation, scale, finger rotation, independent ear attachments, calibration and color-boundary acceptance/rejection.
- `npm run lint`: TypeScript passes.
- `npm run build`: production build passes; Vite reports its existing large-bundle advisory.
- `scripts/validate-fit-browser.js`: executable with the Playwright `browser_run_code` filename argument against the dev server. Checks actual canvas changes and exact reset restoration, two-point calibration, drag offset, comparison, ring rotation and 375px/landscape layouts.
- Visually inspected all four reported ornament categories on the supplied sample photos. Saved results in `artifacts/earrings-fit.png`, `choker-fit.png`, `bangle-fit.png`, and `ring-fit.png`.

The tests establish coordinate and interaction behavior; they are not a population-level accuracy benchmark. Live camera fitting has not been validated on a physical camera in this change.
