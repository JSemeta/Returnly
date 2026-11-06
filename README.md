# Returnly — free iPhone returns organiser

A small installable web app (PWA) for keeping return deadlines in one place.

## Included
- Add, edit and delete returns
- Saved retailer return-period suggestions
- Editable retailer list and return periods
- Upcoming, urgent, overdue and completed views
- Per-return reminder preferences saved with the return
- Export a calendar event (`.ics`) with a one-day-before alert
- Offline app shell after first successful load
- Soft pink responsive design

## Important reminder limitation
This free first version does **not** send scheduled push notifications by itself. iOS web apps need a push service/server for reliable scheduled push alerts. The app saves your reminder preference and lets you add a calendar reminder to Apple Calendar, which can then alert you. The calendar export currently adds an alert one day before the deadline; edit the event in Calendar if you want a different alert.

Retailer periods are editable examples only. Always verify the retailer's policy and whether the period starts from purchase or delivery.

## Put it online for free with GitHub Pages
1. Create/sign in to a free GitHub account.
2. Create a new **public** repository named `returnly`.
3. Upload all files in this folder to the repository root (not the folder itself).
4. Open repository **Settings → Pages**.
5. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
6. Wait for the published URL shown in Pages.
7. Open that URL in Safari on your iPhone. Tap Share → Add to Home Screen → Add.

GitHub Pages is free for public repositories. Do not put private information in this public repository. Return data stays in the browser's local storage on your device; it is not uploaded to GitHub.

## Local preview
Open `index.html` in a browser. Installable PWA features require the app to be served over HTTPS or localhost.
