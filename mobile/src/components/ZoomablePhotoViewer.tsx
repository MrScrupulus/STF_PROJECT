import React from 'react';
import ImageView from 'react-native-image-viewing';

type Props = {
  uri: string | null | undefined;
  visible: boolean;
  onClose: () => void;
};

/** Aperçu plein écran avec pincement (2 doigts) et double tap. */
export default function ZoomablePhotoViewer({ uri, visible, onClose }: Props) {
  if (!uri) {
    return null;
  }

  return (
    <ImageView
      images={[{ uri }]}
      imageIndex={0}
      visible={visible}
      onRequestClose={onClose}
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      presentationStyle="overFullScreen"
    />
  );
}
