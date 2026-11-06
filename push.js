// Returnly single-device web push subscription + reminder synchronisation.
// Only the PUBLIC VAPID key belongs in the browser. Private key stays in Supabase.
(() => {
  'use strict';
  const PUBLIC_VAPID = 'BAlw2aLt_TgS-Km1tJWXoWPGvgguzFctaDQqNQ7BrTE2jr4dr-_tnWOqLmFzW9n2KhAi-W2MBXusVifRwTQF4r8';
  const $ = id => document.getElementById(id);
  const status = text => { $('pushStatus').textContent = text; };
  const toBytes = base64 => {
    const pad = '='.repeat((4 - base64.length % 4) % 4);
    const binary = atob((base64 + pad).replace(/-/g,'+').replace(/_/g,'/'));
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  };
  const client = () => window.returnlySupabase;
  const getUser = async () => {
    if (!client()) return null;
    const {data, error} = await client().auth.getUser();
    if (error) return null;
    return data.user;
  };
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const getRegistration = async () => {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.getRegistration('./');
  };
  const enable = async () => {
    if (!supported()) { status('This browser does not support web push. Use Returnly from your iPhone Home Screen on iOS 16.4 or later.'); return; }
    if (!isStandalone()) { status('Open Returnly using its Home Screen icon to enable iPhone notifications.'); return; }
    if (!await getUser()) { status('Please sign in using the account icon first.'); return; }
    try {
      // iOS requires notification permission to be requested from a user tap.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { status('Notifications are not allowed. Check iPhone Settings → Notifications → Returnly.'); return; }
      status('Registering this iPhone…');
      const reg = await getRegistration();
      if (!reg) throw Error('Service worker not ready; reopen Returnly and try again.');
      const subscription = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({
        userVisibleOnly:true, applicationServerKey:toBytes(PUBLIC_VAPID)
      });
      const user = await getUser();
      if (!user) throw Error('Please sign in again.');
      const {error} = await client().from('returnly_push_subscriptions').upsert({
        user_id:user.id, endpoint:subscription.endpoint, subscription:subscription.toJSON()
      }, {onConflict:'endpoint'});
      if (error) throw error;
      status('Notifications enabled on this iPhone ♡ Now syncing reminders…');
      await sync();
    } catch (err) { status('Could not enable notifications: ' + (err.message || String(err))); }
  };
  // Schedule at 08:00 UK time Monday–Friday, 11:00 Saturday–Sunday.
  // Europe/London automatically accounts for GMT and British Summer Time.
  const isoAtUKReminderTime = (date, offset) => {
    const [y,m,d] = date.split('-').map(Number);
    const day = new Date(Date.UTC(y,m-1,d-offset));
    const weekday = day.getUTCDay();
    const hour = (weekday === 0 || weekday === 6) ? 11 : 8;
    // Determine London's offset on the reminder date, including DST changes.
    // Noon UTC is safely away from the UK clock-change hour.
    const noon = new Date(Date.UTC(day.getUTCFullYear(),day.getUTCMonth(),day.getUTCDate(),12));
    const zone = new Intl.DateTimeFormat('en-GB', {
      timeZone:'Europe/London', timeZoneName:'shortOffset'
    }).formatToParts(noon).find(part => part.type === 'timeZoneName')?.value || 'GMT';
    const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(zone);
    const offsetMinutes = match ? (match[1] === '+' ? 1 : -1) *
      (Number(match[2])*60 + Number(match[3] || 0)) : 0;
    return new Date(Date.UTC(day.getUTCFullYear(),day.getUTCMonth(),day.getUTCDate(),hour) - offsetMinutes*60000).toISOString();
  };
  const rowsFor = (item, userId) => {
    if (item.done || item.reminders === 'none') return [];
    const offsets = (item.reminders || '1').split(',').map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 365);
    const now = Date.now();
    const rows = [];
    for (const [kind,date,label] of [
      ['register',item.registerBy,'register your return code'],
      ['parcel',item.due,'send your return parcel']
    ]) {
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      for (const days of offsets) {
        const scheduled = isoAtUKReminderTime(date,days);
        if (Date.parse(scheduled) <= now) continue;
        rows.push({user_id:userId,return_id:String(item.id),reminder_type:`${kind}-${days}`,
          title:kind === 'register' ? 'Register your return ♡' : 'Your parcel deadline ♡',
          message:`${item.company}: ${label}${days === 0 ? ' today' : days === 1 ? ' tomorrow' : ` in ${days} days`}.`,
          scheduled_for:scheduled,sent_at:null});
      }
    }
    return rows;
  };
  let syncing = false;
  const sync = async () => {
    if (syncing) return;
    syncing = true;
    try {
      const user = await getUser();
      if (!user) { status('Sign in to sync reminders.'); return; }
      if (!supported() || Notification.permission !== 'granted') { status('Enable notifications first.'); return; }
      const reg = await getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) { status('Enable notifications on this iPhone first.'); return; }
      const {error:subError} = await client().from('returnly_push_subscriptions').upsert({
        user_id:user.id, endpoint:sub.endpoint, subscription:sub.toJSON()
      }, {onConflict:'endpoint'});
      if (subError) throw subError;
      const items = JSON.parse(localStorage.getItem('returnly-returns') || '[]');
      const rows = items.flatMap(item => rowsFor(item,user.id));
      // Replace only future, unsent rows. Never remove already-sent rows.
      const {error:delError} = await client().from('returnly_reminders').delete()
        .eq('user_id',user.id).is('sent_at',null).gt('scheduled_for',new Date().toISOString());
      if (delError) throw delError;
      if (rows.length) {
        const {error:insertError} = await client().from('returnly_reminders').upsert(rows, {onConflict:'return_id,reminder_type'});
        if (insertError) throw insertError;
      }
      status(`Notifications enabled ♡ ${rows.length} upcoming reminder${rows.length === 1 ? '' : 's'} synced.`);
    } catch (err) { status('Reminder sync failed: ' + (err.message || String(err))); }
    finally { syncing = false; }
  };
  $('pushEnable').addEventListener('click',enable);
  $('pushSync').addEventListener('click',sync);
  let debounce;
  window.addEventListener('returnly-returns-changed', () => {
    clearTimeout(debounce); debounce = setTimeout(sync,600);
  });
  window.addEventListener('returnly-auth-changed', async () => {
    if (await getUser()) {
      if (supported() && Notification.permission === 'granted') sync();
      else status('Signed in. Tap Enable notifications to get started.');
    } else status('Sign in using the account icon, then enable notifications.');
  });
  window.addEventListener('returnly-auth-ready', () => {
    getUser().then(user => {if (user) status('Signed in. Tap Enable notifications to get started.');});
  });
})();
