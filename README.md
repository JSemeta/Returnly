# Returnly — free iPhone returns organiser (updated edition)

This is an updated copy of the original Returnly app. Keep your original ZIP as a backup; upload these files over the existing files in your GitHub repository to update the live app.

## What's new
- Personal note on the home screen is now read-only inside the app. Edit the separate `note.js` file on GitHub to change the wording for everyone using this website.
- Add each return using the dispatch / delivery date as the starting point.
- Two independent deadlines are calculated from that date: **register return code by** and **return parcel by**.
- Each saved company has two editable timers in **Company settings**: registration days and return days.
- Both dates can also be edited for an individual return.
- Export two Apple Calendar events (one for code registration and one for the parcel deadline). The selected reminder offsets are applied to both events.
- Existing saved returns are migrated in the browser: their current return deadline is preserved, and a registration date is added using the default registration timer.

## Important policy and notification notes
The starter company timers are examples, not live-verified retailer policies. Check each retailer's current terms, including whether the window begins at delivery, purchase, or another event, then adjust the two timers in Company settings. The app uses the date you enter as its common starting point for both timers.

This PWA still does not send independent scheduled push notifications. The calendar export is the no-cost, simplest reminder route: add the two events to Apple Calendar and let iOS notify you. The reminder preference is used for both events in the exported calendar file.

For real web push notifications, see the section below. It requires a push subscription and a small server/backend to schedule and send notifications; GitHub Pages alone cannot send them.

## Push notifications: what would be needed
1. Keep the app hosted over HTTPS and install it to the iPhone Home Screen (iOS 16.4 or later supports web push for installed web apps).
2. Add a **Turn on notifications** button. It must be tapped by the user, request permission, create a Push API subscription, and send that subscription to a backend.
3. Add a backend/database to store each user's push subscription and the two scheduled deadlines per return.
4. Use a server-side Web Push library with VAPID keys to send notifications at the selected reminder offsets. A scheduled job/queue checks due reminders and sends them; the service worker displays them.
5. Handle permission changes, expired subscriptions, duplicate sends, time zones, and deleting/completing a return.

A free-tier backend such as Supabase plus a scheduled function, or Cloudflare Workers with a storage/cron setup, can be used for a small personal project, but free-tier limits and setup change. Do not put VAPID private keys or database service-role keys in the public GitHub repository or browser JavaScript. Push notifications are not implemented in this ZIP yet.

## Update your existing GitHub Pages app without losing the original
1. Keep your old `Returnly-Free-iPhone-App.zip` somewhere safe as a backup.
2. Unzip this updated ZIP on your computer.
3. Open your existing public `returnly` repository on GitHub.
4. Choose **Add file → Upload files**.
5. Open the unzipped `returnly` folder and select all seven files inside it (not the folder itself). Drag them into GitHub's upload area. GitHub will show that files with the same names are being replaced.
6. Commit the changes to the `main` branch.
7. Wait for GitHub Pages to redeploy, then refresh the Returnly website on your iPhone. If it still shows the old version, close the installed app and reopen it; the service worker cache may take a refresh to update.

Your return data and saved note stay in browser storage on your device. Replacing the website files does not normally delete that data. As a precaution, export/add any important reminders to Calendar before updating. GitHub Pages hosts the app files; it does not store your personal return records.

## First install (if needed)
1. Create/sign in to a free GitHub account.
2. Create a public repository named `returnly` and upload all seven files to its root.
3. Open **Settings → Pages**. Under Build and deployment, choose **Deploy from a branch**, branch `main`, folder `/(root)`, then Save.
4. Open the published URL in Safari on your iPhone, tap Share → Add to Home Screen → Add.


## Change the home-screen note (no coding experience needed)
1. Open your Returnly repository on GitHub.
2. Click the file named `note.js`.
3. Click the pencil icon (Edit this file).
4. Change only the words between the quotation marks on the `window.RETURNLY_NOTE` line.
   Example: `window.RETURNLY_NOTE = "Remember to check your parcels every Friday. ♡";`
5. Click **Commit changes**.
6. Wait a few minutes for GitHub Pages to publish, then refresh Returnly.

You do not need to edit `index.html`, `app.js`, or `styles.css` to change the note. The note is shared website text, not private per-device information. Anyone visiting the site sees the same note.
