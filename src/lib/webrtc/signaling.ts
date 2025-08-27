import { addDoc, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { database } from '../../config/firebase';

export interface CallDocument {
  from: string;
  to: string;
  type: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  createdAt: unknown;
}

export const callRef = (callId: string) => doc(database, 'calls', callId);

export const createCall = (callId: string, data: Omit<CallDocument, 'createdAt'>) =>
  setDoc(callRef(callId), { ...data, createdAt: serverTimestamp() });

export const saveAnswer = (callId: string, answer: RTCSessionDescriptionInit) =>
  setDoc(callRef(callId), { answer }, { merge: true });

export const addCandidate = (callId: string, side: 'A' | 'B', candidate: RTCIceCandidateInit) =>
  addDoc(collection(callRef(callId), `candidates_${side}`), candidate);
