import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  arrayUnion,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import CryptoJS from 'crypto-js';

export interface Diary {
  id: string;
  diaryName: string;
  createdBy: string;
  members: string[];
  memberNames: string[];
  inviteCode: string;
  pinHash: string;
  backgroundImage?: string;
  createdAt: any;
  lastUpdated: any;
}

export const diaryService = {
  // Hash PIN
  hashPin: (pin: string) => {
    return CryptoJS.SHA256(pin).toString();
  },

  // Generate a random 6-digit code
  generateInviteCode: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Create a new shared diary
  createDiary: async (userId: string, userName: string, diaryName: string, pin: string) => {
    const diaryId = `diary_${userId}_${Date.now()}`;
    const inviteCode = diaryService.generateInviteCode();
    const pinHash = diaryService.hashPin(pin);
    
    const diaryData: Diary = {
      id: diaryId,
      diaryName,
      createdBy: userId,
      members: [userId],
      memberNames: [userName],
      inviteCode,
      pinHash,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    };

    await setDoc(doc(db, 'diaries', diaryId), diaryData);
    
    // Also track the invite code globally for easy lookup
    await setDoc(doc(db, 'invites', inviteCode), {
      diaryId,
      createdBy: userId,
      active: true
    });

    return diaryData;
  },

  // Link a diary to a user profile
  linkDiaryToUser: async (userId: string, diaryId: string) => {
    await updateDoc(doc(db, 'users', userId), {
      diaryId,
      lastUpdated: serverTimestamp()
    });
  },

  // Join a diary using an invite code
  joinDiary: async (userId: string, userName: string, inviteCode: string) => {
    // 1. Find the invite
    const inviteDoc = await getDoc(doc(db, 'invites', inviteCode));
    if (!inviteDoc.exists()) {
      throw new Error("Invalid invite code.");
    }

    const { diaryId } = inviteDoc.data();
    
    // 2. Add member to diary
    const diaryRef = doc(db, 'diaries', diaryId);
    const diaryDoc = await getDoc(diaryRef);
    
    if (!diaryDoc.exists()) {
      throw new Error("Diary not found.");
    }

    const diaryData = diaryDoc.data();
    if (diaryData.members.length >= 2) {
      throw new Error("This diary already has two writers.");
    }

    if (diaryData.members.includes(userId)) {
      throw new Error("You are already a member of this diary.");
    }

    await updateDoc(diaryRef, {
      members: arrayUnion(userId),
      memberNames: arrayUnion(userName),
      lastUpdated: serverTimestamp()
    });

    // 3. Update user profile
    await updateDoc(doc(db, 'users', userId), {
      diaryId,
      lastUpdated: serverTimestamp()
    });

    return diaryData;
  },

  // Get user's diary
  getUserDiary: async (diaryId: string) => {
    const docSnap = await getDoc(doc(db, 'diaries', diaryId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Diary;
    }
    return null;
  }
};
