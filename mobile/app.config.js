const fs = require('fs');
const path = require('path');
const appJson = require('./app.json');

function readMapsKeyFromGoogleServices() {
  try {
    const gsPath = path.join(__dirname, 'google-services.json');
    if (!fs.existsSync(gsPath)) {
      return '';
    }
    const gs = JSON.parse(fs.readFileSync(gsPath, 'utf8'));
    return String(gs?.client?.[0]?.api_key?.[0]?.current_key || '').trim();
  } catch {
    return '';
  }
}

/**
 * Clé Maps lue au build (EAS GOOGLE_MAPS_API_KEY, sinon clé Android firebase).
 * Sans clé, l’APK Android affiche un fond vide avec seulement les pins.
 */
module.exports = () => {
  const expo = JSON.parse(JSON.stringify(appJson.expo));
  const mapsKey = String(
    process.env.GOOGLE_MAPS_API_KEY ||
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
      readMapsKeyFromGoogleServices() ||
      ''
  ).trim();

  if (mapsKey) {
    expo.android = expo.android || {};
    expo.android.config = {
      ...(expo.android.config || {}),
      googleMaps: { apiKey: mapsKey },
    };
    // iOS : Apple Maps (react-native-maps 1.27 n’a plus le pod react-native-google-maps).
  }

  const localGoogleServices = path.join(__dirname, 'google-services.json');
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ||
    (fs.existsSync(localGoogleServices) ? './google-services.json' : '');
  if (googleServicesFile) {
    expo.android = expo.android || {};
    expo.android.googleServicesFile = googleServicesFile;
  }

  expo.extra = {
    ...(expo.extra || {}),
    eas: {
      ...((expo.extra && expo.extra.eas) || {}),
      projectId:
        (expo.extra && expo.extra.eas && expo.extra.eas.projectId) ||
        '7773bd56-c404-4652-9f8e-4b15cff939fe',
    },
    googleMapsConfigured: Boolean(mapsKey),
  };

  expo.plugins = [...(expo.plugins || []), './plugins/withGoogleMapsApiKey'];

  return { expo };
};
