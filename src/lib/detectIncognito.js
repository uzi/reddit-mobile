export default function detectIncognito() {
  return new Promise((resolve) => {
    const fs = window.RequestFileSystem || window.webkitRequestFileSystem;

    const key = 'INCOGNITO_DETECTION_KEY';
    const detectionSuccess = () => { resolve(true); };
    const detectionFailure = () => { resolve(false); };

    // Chrome
    if (fs) {
      fs(
        window.TEMPORARY,
        1,
        detectionFailure,
        detectionSuccess,
      );

      return;
    }

    // iOS < 11
    const storage = window.sessionStorage;
    try {
      storage.setItem(key, key);
      storage.removeItem(key);
    } catch (e) {
      if (e.code === DOMException.QUOTA_EXCEEDED_ERR && storage.length === 0) {
        detectionSuccess();
        return;
      }
    }

    // iOS 11
    try {
      window.openDatabase(null, null, null, null);
    } catch (e) {
      detectionSuccess();
      return;
    }

    detectionFailure();
  });
}
