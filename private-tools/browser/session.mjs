let expiryTimer, generation = 0, signingOut = false;
const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('cardblueprints-private-session') : null;

function expired(message = 'Your session expired. Save your draft, sign in in a new tab, then try again.') {
  if (signingOut) return;
  generation++;
  clearTimeout(expiryTimer);
  document.getElementById('session-status').textContent = message;
  document.getElementById('reauth').hidden = false;
  window.dispatchEvent(new Event('private-session-expired'));
}
function signedOut() {
  if (signingOut) return;
  signingOut = true;
  generation++;
  clearTimeout(expiryTimer);
  window.dispatchEvent(new Event('private-signout'));
  document.body.replaceChildren(Object.assign(document.createElement('p'), {textContent: 'Signing out…'}));
  location.replace('/cdn-cgi/access/logout');
}
if (channel) channel.onmessage = event => { if (event.data === 'signout') signedOut(); };
document.getElementById('logout').onclick = () => {
  if (!confirm('Sign out and clear this workspace? Download any unsaved draft first.')) return;
  channel?.postMessage('signout'); signedOut();
};
window.addEventListener('pageshow', event => { if (event.persisted) { expired(); void api('/api/session').catch(() => {}); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden) void api('/api/session').catch(() => {}); });

export async function api(path, body) {
  if (signingOut) throw Error('Signed out.');
  const started = generation;
  let response;
  try {
    response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
      cache: 'no-store', redirect: 'error', headers: {'X-Requested-With': 'XMLHttpRequest', ...(body === undefined ? {} : {'Content-Type': 'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    });
  } catch {
    if (started === generation) expired('Connection or sign-in unavailable. Save your draft before leaving this tab.');
    throw Error('Reconnect or sign in again, then retry.');
  }
  if (started !== generation) throw Error('Signed out.');
  if ([401, 403].includes(response.status) || !response.headers.get('Content-Type')?.includes('application/json')) {
    expired(); throw Error('Sign in again to continue.');
  }
  const expires = Number(response.headers.get('X-Session-Expires'));
  if (response.ok && (!Number.isFinite(expires) || expires <= Date.now() / 1000)) {
    expired(); throw Error('Sign in again to continue.');
  }
  if (expires > Date.now() / 1000) {
    clearTimeout(expiryTimer);
    expiryTimer = setTimeout(expired, Math.min(2147483647, expires * 1000 - Date.now()));
    document.getElementById('session-status').textContent = 'Private session · results are not saved on the server';
    document.getElementById('reauth').hidden = true;
  }
  const value = await response.json();
  if (started !== generation) throw Error('This request belongs to an earlier session.');
  if (response.ok && expires <= Date.now() / 1000) {
    expired(); throw Error('Sign in again to continue.');
  }
  if (!response.ok) throw Error(value.error || 'The request could not be completed.');
  return value;
}
export function download(text, name, type) {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function fileStem(draft) {
  const name = draft.people[0].name.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'client';
  return `my-card-blueprint-${draft.offer}-${name.toLowerCase()}-${draft.readingDate || 'draft'}`;
}
