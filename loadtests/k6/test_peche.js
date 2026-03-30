/**
 * Test de charge type « journée de pêche » — STF API
 *
 * Lancement rapide (depuis la racine du dépôt) :
 *   ./loadtests/run-loadtest.sh
 * ou :
 *   k6 run loadtests/k6/test_peche.js
 *
 * Variables (env ou fichier loadtests/.env) :
 *   BASE_URL, COMPETITION_ID, SPECIES_ID
 *   JWT=...  OU  LOGIN_EMAIL + LOGIN_PASSWORD
 *   INCLUDE_PHOTO=1  (optionnel)
 *   K6_SCENARIO=smoke|full  — smoke = court, peu de VU (défaut si défini dans run script)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const catchCreateDuration = new Trend('catch_create_duration', true);

const TINY_JPEG_B64 =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xbXF5fY2RlZnZ2Zv/2wBDAQ4PEREVFQwWDg8VFA8VFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRcVFRf/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCWo//Z';

const isSmoke = __ENV.K6_SCENARIO === 'smoke';

export const options = isSmoke
  ? {
      vus: Number(__ENV.K6_SMOKE_VUS || 5),
      duration: __ENV.K6_SMOKE_DURATION || '45s',
      thresholds: {
        http_req_failed: ['rate<0.5'],
        http_req_duration: ['p(95)<8000'],
      },
    }
  : {
      stages: [
        { duration: '1m', target: 20 },
        { duration: '2m', target: 60 },
        { duration: '5m', target: 80 },
        { duration: '2m', target: 80 },
        { duration: '1m', target: 0 },
      ],
      thresholds: {
        http_req_failed: ['rate<0.15'],
        http_req_duration: ['p(95)<5000'],
        errors: ['rate<0.15'],
      },
    };

const BASE_URL = (__ENV.BASE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
const COMPETITION_ID = __ENV.COMPETITION_ID || '1';
const SPECIES_ID = __ENV.SPECIES_ID || '1';
const INCLUDE_PHOTO = __ENV.INCLUDE_PHOTO === '1' || __ENV.INCLUDE_PHOTO === 'true';
/** Si 1 : ne fait que des GET (aucune création de prise en BDD) */
const READ_ONLY = __ENV.READ_ONLY === '1' || __ENV.READ_ONLY === 'true';

export function setup() {
  const jwtFromEnv = __ENV.JWT || __ENV.K6_JWT || '';
  if (jwtFromEnv) {
    return { token: jwtFromEnv };
  }
  const email = __ENV.LOGIN_EMAIL || '';
  const password = __ENV.LOGIN_PASSWORD || '';
  if (!email || !password) {
    throw new Error(
      'Fournir JWT=... ou LOGIN_EMAIL + LOGIN_PASSWORD pour authentifier les requêtes.'
    );
  }
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  );
  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginRes.status} ${String(loginRes.body).slice(0, 500)}`);
  }
  let token;
  try {
    const j = loginRes.json();
    token = j.token || j.access_token;
  } catch (e) {
    throw new Error('Login response JSON invalide');
  }
  if (!token) {
    throw new Error('Pas de token dans la réponse login');
  }
  return { token };
}

function hdr(token) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export default function (data) {
  const params = { headers: hdr(data.token) };
  const r = READ_ONLY ? Math.random() * 0.799 : Math.random();

  if (r < 0.4) {
    const res = http.get(`${BASE_URL}/api/competitions/${COMPETITION_ID}`, params);
    const ok = check(res, { 'competition 2xx': (x) => x.status >= 200 && x.status < 300 });
    errorRate.add(!ok);
  } else if (r < 0.65) {
    const res = http.get(`${BASE_URL}/api/competitions/${COMPETITION_ID}/stats`, params);
    const ok = check(res, { 'stats 2xx': (x) => x.status >= 200 && x.status < 300 });
    errorRate.add(!ok);
  } else if (r < 0.8) {
    const res = http.get(`${BASE_URL}/api/competitions/${COMPETITION_ID}/catches`, params);
    const ok = check(res, { 'catches list 2xx': (x) => x.status >= 200 && x.status < 300 });
    errorRate.add(!ok);
  } else {
    const body = {
      speciesId: Number(SPECIES_ID),
      size: Math.round(20 + Math.random() * 45),
      latitude: 50.69 + Math.random() * 0.04,
      longitude: 3.16 + Math.random() * 0.06,
      comment: `k6 vu=${__VU} iter=${__ITER}`,
    };
    if (INCLUDE_PHOTO) {
      body.photoUrl = TINY_JPEG_B64;
    }
    const res = http.post(
      `${BASE_URL}/api/competitions/${COMPETITION_ID}/catches`,
      JSON.stringify(body),
      params
    );
    catchCreateDuration.add(res.timings.duration);
    const ok = check(res, {
      'catch create 201': (x) => x.status === 201,
    });
    errorRate.add(!ok);
  }

  sleep(isSmoke ? 0.5 + Math.random() * 1.5 : 1 + Math.random() * 4);
}
