// Returnly authentication only. Push notifications will be added in a later update.
// The publishable key and project URL are safe to expose; never add a secret/service_role key here.
(() => {
  const PROJECT_URL = 'https://cbbiquszckqlfrbczagf.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_mwgrjmF9fQwD3kKzKbuZAQ_5g1JT80h';
  const $ = id => document.getElementById(id);
  const status = message => { $('authStatus').textContent = message; };
  const dialog = $('authDialog');
  let client;
  let currentEmail = '';
  const render = async () => {
    const { data: { user }, error } = await client.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError') console.warn('Auth status:', error.message);
    const signedIn = !!user;
    $('authEmailForm').classList.toggle('hidden', signedIn);
    $('authPasswordForm').classList.toggle('hidden', signedIn);
    $('authCodeForm').classList.add('hidden');
    $('authLinkForm').classList.toggle('hidden', signedIn);
    $('authSignOut').classList.toggle('hidden', !signedIn);
    $('authBtn').textContent = signedIn ? '♥' : '♙';
    $('authBtn').title = signedIn ? 'Signed in' : 'Sign in';
    status(signedIn ? `Signed in as ${user.email}. You can now enable notifications.` : 'Sign in with your Supabase email and password, or use an email link.');
  };
  $('authBtn').onclick = () => dialog.showModal();
  $('authClose').onclick = () => dialog.close();
  if (!window.supabase?.createClient) {
    $('authBtn').onclick = () => { dialog.showModal(); status('Could not load sign-in. Please check your internet connection and reopen Returnly.'); };
    return;
  }
  client = window.supabase.createClient(PROJECT_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.returnlySupabase = client;
  window.dispatchEvent(new Event('returnly-auth-ready'));
  $('authPasswordForm').onsubmit = async event => {
    event.preventDefault();
    const email = $('authPasswordEmail').value.trim();
    const password = $('authPassword').value;
    status('Signing in…');
    const { error } = await client.auth.signInWithPassword({ email, password });
    $('authPassword').value = '';
    if (error) { status(`Could not sign in: ${error.message}`); return; }
    await render();
    window.dispatchEvent(new Event('returnly-auth-changed'));
  };
  $('authEmailForm').onsubmit = async event => {
    event.preventDefault();
    currentEmail = $('authEmail').value.trim();
    status('Sending your sign-in email…');
    const { error } = await client.auth.signInWithOtp({
      email: currentEmail,
      options: { emailRedirectTo: new URL('./', location.href).href, shouldCreateUser: true }
    });
    if (error) { status(`Could not send email: ${error.message}`); return; }
    $('authCodeForm').classList.remove('hidden');
    $('authLinkForm').classList.remove('hidden');
    status('Email sent. On your iPhone, COPY the sign-in link without opening it, then paste it below. If you already opened it in Safari, request a new link first.');
  };
  $('authCodeForm').onsubmit = async event => {
    event.preventDefault();
    status('Checking your code…');
    const { error } = await client.auth.verifyOtp({ email: currentEmail, token: $('authCode').value.trim(), type: 'email' });
    if (error) { status(`Code not accepted: ${error.message}`); return; }
    await render();
  };
  // Verify an unused Supabase magic link directly inside the installed PWA.
  // The default Supabase email links to /auth/v1/verify?token=...&type=magiclink.
  // Never navigate to the pasted link; that would open Safari and consume the token there.
  $('authLinkForm').onsubmit = async event => {
    event.preventDefault();
    const raw = $('authLink').value.trim().replace(/&amp;/g, '&');
    let url;
    try { url = new URL(raw); } catch { status('That does not look like a valid URL. Copy the complete sign-in link from the email.'); return; }
    const expected = new URL(PROJECT_URL);
    if (url.protocol !== 'https:' || url.origin !== expected.origin || url.pathname !== '/auth/v1/verify') {
      status('This is not a Returnly Supabase verification link. Copy the original link from the email, not the Safari page address.');
      return;
    }
    const type = url.searchParams.get('type');
    const tokenHash = url.searchParams.get('token_hash') || url.searchParams.get('token');
    if (!tokenHash || !['magiclink', 'email'].includes(type)) {
      status('The link does not contain a usable sign-in token. Request a new email and copy the full original link.');
      return;
    }
    status('Signing in securely…');
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: type === 'magiclink' ? 'magiclink' : 'email' });
    if (error) { status(`Could not sign in: ${error.message}. The link may have expired or already been opened. Request a new one.`); return; }
    $('authLink').value = '';
    await render();
  };
  $('authSignOut').onclick = async () => {
    const { error } = await client.auth.signOut();
    if (error) { status(error.message); return; }
    await render();
  };
  client.auth.onAuthStateChange(() => { setTimeout(() => { render().catch(console.error); window.dispatchEvent(new Event('returnly-auth-changed')); }, 0); });
  render().catch(error => status(`Sign-in setup error: ${error.message}`));
})();
