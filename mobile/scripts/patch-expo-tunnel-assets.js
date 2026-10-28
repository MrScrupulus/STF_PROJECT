/**
 * Expo CLI plante sur le tunnel exp.direct : bundleUrl n'a souvent pas de "/" après l'hôte,
 * donc bundleUrl.match(/^https?:\/\/.*?\//)[0] lève "Cannot read properties of null (reading '0')".
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'start',
  'server',
  'middleware',
  'ManifestMiddleware.js'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

let source = fs.readFileSync(target, 'utf8');
if (source.includes('STF_TUNNEL_ASSET_ORIGIN')) {
  process.exit(0);
}

const unsafe = 'bundleUrl.match(/^https?:\\/\\/.*?\\//)[0]';
if (!source.includes(unsafe)) {
  process.exit(0);
}

const helper = `function stfAssetOrigin(bundleUrl) {
    // STF_TUNNEL_ASSET_ORIGIN
    const raw = String(bundleUrl || '');
    try {
        const parsed = new URL(raw.includes('://') ? raw : 'http://' + raw);
        if (parsed.protocol === 'exp:') {
            parsed.protocol = 'https:';
        }
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.protocol + '//' + parsed.host + '/';
        }
    } catch (e) {}
    const httpMatch = raw.match(/^(https?:\\/\\/[^/?#]+)/i);
    if (httpMatch) {
        return httpMatch[1] + '/';
    }
    const expMatch = raw.match(/^exp:\\/\\/([^/?#]+)/i);
    if (expMatch) {
        return 'https://' + expMatch[1] + '/';
    }
    return 'http://127.0.0.1:8081/';
}
`;

if (source.startsWith('"use strict";')) {
  source = '"use strict";\n' + helper + source.slice('"use strict";'.length);
} else {
  source = helper + source;
}

source = source.split(unsafe).join('stfAssetOrigin(bundleUrl)');
fs.writeFileSync(target, source);
console.log('[patch-expo-tunnel-assets] middleware Expo CLI corrigé pour le tunnel');
