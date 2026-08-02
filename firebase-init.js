// 沿用 cheryl-vocab/feige-vocab 同一個 Firebase 專案，用 self_grammar 這棵樹區隔資料。
const firebaseConfig = {
  apiKey: "AIzaSyCuxJj5Rx9oRbwMWuoM2HMd_lYnu91T6qA",
  authDomain: "cheryl-vocab.firebaseapp.com",
  projectId: "cheryl-vocab",
  storageBucket: "cheryl-vocab.firebasestorage.app",
  messagingSenderId: "161394045130",
  appId: "1:161394045130:web:db0461c02f3f8ef298c433",
  measurementId: "G-EXJ7MP94PM"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
