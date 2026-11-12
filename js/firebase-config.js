/* firebase-config.js: connection for the Shared words page (Firebase Firestore).
   Paste the firebaseConfig object from the Firebase console here (Project settings › Your apps › Web app).
   These values are not secret: Firebase web keys are meant to be public. Access is controlled
   by the Firestore security rules (see the Shared words page for the rules to paste).
   Leave it as null to turn the Shared words page off. */
window.MS = window.MS || {};
MS.firebaseConfig = null;
/* Example:
MS.firebaseConfig = {
  apiKey: 'AIza…',
  authDomain: 'masume-xxxx.firebaseapp.com',
  projectId: 'masume-xxxx',
  storageBucket: 'masume-xxxx.appspot.com',
  messagingSenderId: '…',
  appId: '…',
};
*/
