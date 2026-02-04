// Simple test to check Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { firebaseConfig } from './firebaseConfig.js';

console.log('Firebase config loaded:', !!firebaseConfig);
console.log('Initializing Firebase...');

try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('Firebase initialized successfully!');
} catch (error) {
    console.error('Firebase initialization failed:', error);
}