import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBqNOJs8Mzw7JBcKSfhFL003kiAZwyiz74",
    authDomain: "untitledcantogame1.firebaseapp.com",
    projectId: "untitledcantogame1",
    storageBucket: "untitledcantogame1.appspot.com",
    messagingSenderId: "681922588840",
    appId: "1:681922588840:web:0a0f22b374859bedda529d"
  };

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);