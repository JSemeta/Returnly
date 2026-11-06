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
    $('authCodeForm').classList.add('hidden');
    $('authSignOut').classList.toggle('hidden', !signedIn);
    $('authBtn').textContent = signedIn ? '♥' : '♙';
    $('authBtn').title = signedIn ? 'Signed in' : 'Sign in';
    status(signedIn ? `Signed in as ${user.email}. Notifications are not enabled yet.` : 'Sign in using your email.');
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
    status('Email sent. Open the sign-in link, or enter the email code if your email contains one. If the link opens in Safari rather than the Home Screen app, use a code to sign in inside Returnly.');
  };
  $('authCodeForm').onsubmit = async event => {
    event.preventDefault();
    status('Checking your code…');
    const { error } = await client.auth.verifyOtp({ email: currentEmail, token: $('authCode').value.trim(), type: 'email' });
    if (error) { status(`Code not accepted: ${error.message}`); return; }
    await render();
  };
  $('authSignOut').onclick = async () => {
    const { error } = await client.auth.signOut();
    if (error) { status(error.message); return; }
    await render();
  };
  client.auth.onAuthStateChange(() => { setTimeout(() => render().catch(console.error), 0); });
  render().catch(error => status(`Sign-in setup error: ${error.message}`));
})();
