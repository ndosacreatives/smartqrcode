import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, deleteDoc, serverTimestamp, orderBy, increment } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { UploadedFile } from '@/lib/types';

// Base collection reference
const filesCollection = 'uploadedFiles';

/**
 * Upload a file and create a database record
 */
export async function uploadFile(
  userId: string,
  file: File,
  isPublic: boolean = false,
  expiresAt?: Date
): Promise<UploadedFile> {
  try {
    const storage = getStorage();
    const fileId = crypto.randomUUID(); // Generate unique ID for the file
    const filePath = `uploads/${userId}/${fileId}/${file.name}`;
    const fileRef = ref(storage, filePath);
    
    // Upload the file to Firebase Storage
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    
    // Create a record in Firestore
    const fileData: Omit<UploadedFile, 'id'> = {
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadDate: serverTimestamp(),
      downloadUrl,
      accessCount: 0,
      isPublic,
      ...(expiresAt && { expiresAt })
    };
    
    const docRef = await addDoc(collection(db, filesCollection), fileData);
    
    return {
      id: docRef.id,
      ...fileData,
      accessCount: 0
    } as UploadedFile;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Get all files uploaded by a user
 */
export async function getUserFiles(userId: string): Promise<UploadedFile[]> {
  try {
    const q = query(
      collection(db, filesCollection),
      where('userId', '==', userId),
      orderBy('uploadDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UploadedFile);
  } catch (error) {
    console.error('Error getting user files:', error);
    throw error;
  }
}

/**
 * Get a specific file by ID
 */
export async function getFile(fileId: string): Promise<UploadedFile | null> {
  try {
    const docRef = doc(db, filesCollection, fileId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UploadedFile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
}

/**
 * Record a file access/download
 */
export async function recordFileAccess(fileId: string): Promise<void> {
  try {
    const docRef = doc(db, filesCollection, fileId);
    await updateDoc(docRef, {
      accessCount: increment(1),
      lastAccessed: serverTimestamp()
    });
  } catch (error) {
    console.error('Error recording file access:', error);
    throw error;
  }
}

/**
 * Delete a file and its database record
 */
export async function deleteFile(fileId: string, userId: string): Promise<void> {
  try {
    // Get the file first to verify ownership and get file path
    const file = await getFile(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }
    
    // Verify ownership
    if (file.userId !== userId) {
      throw new Error('You do not have permission to delete this file');
    }
    
    // Delete from storage
    const storage = getStorage();
    const fileRef = ref(storage, `uploads/${userId}/${fileId}/${file.fileName}`);
    
    try {
      await deleteObject(fileRef);
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with deleting the database record
    }
    
    // Delete database record
    await deleteDoc(doc(db, filesCollection, fileId));
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Associate a file with a QR code
 */
export async function linkFileToQRCode(fileId: string, qrCodeId: string): Promise<void> {
  try {
    const docRef = doc(db, filesCollection, fileId);
    await updateDoc(docRef, {
      qrCodeId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error linking file to QR code:', error);
    throw error;
  }
}

/**
 * Check if a file has expired
 */
export function isFileExpired(file: UploadedFile): boolean {
  if (!file.expiresAt) return false;
  
  const expiryDate = file.expiresAt instanceof Date
    ? file.expiresAt
    : new Date(file.expiresAt.seconds * 1000);
  
  return new Date() > expiryDate;
} 