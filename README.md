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

## Fix for old versions showing on iPhone
This version updates `sw.js` to prefer fresh network files while online and uses cached copies only when offline. It also changes asset URLs to help Safari refresh the app. Upload all files in this folder to your existing GitHub repository and commit them. Do not clear Safari website data or delete the Home Screen app: your returns are stored locally. After GitHub Pages completes, open Returnly in Safari while online, wait a moment, close and reopen the Home Screen app. A second reopening may be necessary for the service worker to take control.


## Email sign-in (version 5)
This update adds a private email sign-in screen (person icon at the top). It does **not** yet send push notifications. Your returns and retailer settings remain in localStorage.

Supabase project URL: `https://cbbiquszckqlfrbczagf.supabase.co` (the browser URL must not include `/rest/v1/`). The public publishable key is configured in `auth.js`; never commit private or service-role keys.

In Supabase Authentication → URL Configuration, use your exact GitHub Pages URL as Site URL and an allowed redirect. In Authentication → Providers → Email, enable email sign-in.

**iPhone note:** Email magic links sometimes open Safari rather than the Home Screen app, which can have separate sign-in storage. For the most reliable single-device login, enable an email OTP code template in Supabase Authentication → Email Templates → Magic Link. Make the email body include `{{ .Token }}` so you can copy the code into the Returnly Home Screen app. The sign-in form supports both links and codes. If the code is not present, the email template needs changing.

After you have signed in, turn off public sign-ups in Supabase Authentication settings. Before connecting any notification endpoints, restrict access to your exact authenticated user ID in the server and database. The current database schema alone does not implement this protection.

Push notifications require a separate secure sender, a push subscription endpoint, VAPID keys, and a scheduler. They are **not** active in this release.


## Sign in to the installed iPhone Home Screen app using a magic link
1. Open Returnly from its Home Screen icon and tap Account.
2. Enter the email address you want to use and request a sign-in email.
3. In the email, **copy the original Supabase sign-in URL without opening it**. On iPhone, long-press the link and choose Copy Link.
4. Return to the Home Screen app, paste it in **Paste your sign-in link**, and tap **Complete sign-in**.
5. A magic link can be used only once. If you opened it in Safari already, request a new link.

Keep your customised `note.js` file on GitHub: **do not upload the `note.js` from this ZIP**.

Security: the pasted link is a temporary sign-in credential. Do not share it with anyone or paste it into public GitHub files. This update enables login only; push notifications are not yet implemented.


## Push notifications: version 7 (not fully live until scheduled sender is configured)
This update adds the **Notifications** panel, service-worker push handling, subscription registration and reminder syncing. It **does not** create or activate the scheduled Supabase job. Keep your customised `note.js` on GitHub: this ZIP deliberately does not contain it.

Upload the included files to GitHub, but do not delete your existing `note.js`. The app requires a signed-in Supabase account, a supported iPhone Home Screen installation, and permission to show notifications. The public VAPID key is in `push.js`; the private key stays in Supabase.

Supabase tables must exist and have RLS policies allowing authenticated users to insert/select/delete their own rows. For the single-user setup, also restrict policies and the server-side sender to the intended authenticated UID before activating automatic sending. The current sender needs a scheduler and stronger duplicate-delivery protection before production use.

A future sender should handle HTTP 404/410 expired subscriptions, retry transient failures, avoid concurrent duplicate sends, and avoid re-sending when any device has already received a reminder. Until that is completed, do not turn on a cron schedule.

Reminder times are calculated at 9 AM in the iPhone's current time zone when syncing. If you change time zones, tap Sync reminders. Your existing returns remain in localStorage. The server receives company names, deadlines, return IDs, and subscription data only for notification delivery.
