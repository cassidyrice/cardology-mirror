import {createRemoteJWKSet, jwtVerify} from 'jose';

export const APP_ORIGIN = 'https://reports.cardblueprints.com';
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

let cachedTeam, cachedKeys;
export async function verifyAccess(request, env, testKeys) {
  const {ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: audience, ALLOWED_EMAIL: email} = env;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/.test(team || '') ||
      !/^[a-f0-9]{64}$/.test(audience || '') ||
      typeof email !== 'string' || !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email)) {
    throw new HttpError(503, 'Private access has not been configured.');
  }
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!assertion || assertion.length > 16000) throw new HttpError(401, 'Sign in again to continue.');
  try {
    if (!testKeys && cachedTeam !== team) {
      cachedKeys = createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`), {
        timeoutDuration: 5000, cooldownDuration: 30000, cacheMaxAge: 600000,
      });
      cachedTeam = team;
    }
    const {payload} = await jwtVerify(assertion, testKeys || cachedKeys, {
      issuer: `https://${team}`, audience, algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'email'], clockTolerance: 0,
    });
    if (typeof payload.email !== 'string' || payload.email.toLowerCase() !== email.toLowerCase() ||
        typeof payload.sub !== 'string' || !payload.sub || payload.iat > Date.now() / 1000) {
      throw new Error('Wrong identity');
    }
    return {expires: payload.exp};
  } catch {
    // Never expose tokens, claims or upstream JWKS errors in responses/logs.
    throw new HttpError(401, 'Sign in again to continue.');
  }
}
