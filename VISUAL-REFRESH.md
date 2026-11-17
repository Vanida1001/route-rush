# Route Rush — Visual refresh

The game should look like a game: playful, colourful and alive on every screen, while game rules, saved data and tests stay unchanged.

| Area | Change |
| --- | --- |
| Home | The top card becomes an animated mini city scene that reuses the SVG art from `js/ui/art.js`: HDB blocks, the river, and the player's van driving a loop. The Play button sits on top of it. |
| Logo and font | A chunky rounded "Route Rush" logo. A playful rounded font (e.g. Fredoka or Baloo) with a system font fallback, cached by the service worker for offline use. |
| Colours | A bolder palette: sunset sky gradient, deep teal and warm red. Each mode has its own colour: Daily red, Career teal, Rush Hour yellow. Dark mode and high contrast keep working. |
| Buttons | Chunky 3D buttons with a darker bottom edge that press down when tapped. |
| Icons | Simple custom SVG icons in the same style as the city art, replacing emoji. |
| Motion | Screens slide in, the Play button gently pulses, the streak flame flickers, star counts pop up. All motion follows the device's reduced-motion setting. |
| Career | An illustrated map with a winding road and level stops along it. |
| Results | Stars stamp in one by one, the van does a victory bounce, unlocks appear as gift-box reveals. |
