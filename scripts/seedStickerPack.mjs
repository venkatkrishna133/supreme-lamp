import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

// Firebase config must be supplied via environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function seed() {
  const stickersDir = path.resolve('media/stickers');
  const files = await readdir(stickersDir);

  for (const file of files) {
    const filePath = path.join(stickersDir, file);
    const fileBuffer = await readFile(filePath);
    const storageRef = ref(storage, `stickers/default/${file}`);
    await uploadBytes(storageRef, fileBuffer);
    const imageURL = await getDownloadURL(storageRef);
    const stickerId = path.parse(file).name;

    await setDoc(doc(db, 'stickers', 'default', 'items', stickerId), {
      name: file,
      imageURL,
      keywords: [],
    });
    console.log(`Uploaded ${file}`);
  }

  console.log('Sticker pack seeded.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
