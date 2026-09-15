const appJson = require('./app.json');

/**
 * Clé Maps lue au build (EAS secret GOOGLE_MAPS_API_KEY ou .env local).
 * Sans clé, l’APK Android affiche un fond gris à la place de la carte.
 */
module.exports = () => {
  const expo = JSON.parse(JSON.stringify(appJson.expo));
  const mapsKey = String(
    process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  ).trim();

  if (mapsKey) {
    expo.android = expo.android || {};
    expo.android.config = {
      ...(expo.android.config || {}),
      googleMaps: { apiKey: mapsKey },
    };
    expo.ios = expo.ios || {};
    expo.ios.config = {
      ...(expo.ios.config || {}),
      googleMapsApiKey: mapsKey,
    };
  }

  expo.extra = {
    ...(expo.extra || {}),
    googleMapsConfigured: Boolean(mapsKey),
  };

  expo.plugins = [...(expo.plugins || []), './plugins/withGoogleMapsApiKey'];

  return { expo };
};
