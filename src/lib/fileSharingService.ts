import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { UploadedFile } from '@/lib/types';

// Collection names
const sharingCollection = 'fileSharing';
const filesCollection = 'uploadedFiles';

interface SharePermission {
  id: string;
  fileId: string;
  createdBy: string;
  sharedWith: string; // email address or 'public'
  createdAt: any;
  expiresAt?: any;
  accessType: 'view' | 'download';
  accessCount: number;
  lastAccessed?: any;
  password?: string; // Optional password protection
}

/**
 * Share a file with specific email addresses
 */
export async function shareFileWithUsers(
  fileId: string,
  userId: string,
  sharedEmails: string[],
  accessType: 'view' | 'download' = 'view',
  expiresAt?: Date,
  password?: string
): Promise<string[]> {
  try {
    // First verify the user owns the file
    const fileRef = doc(db, filesCollection, fileId);
    const fileSnap = await getDoc(fileRef);
    
    if (!fileSnap.exists()) {
      throw new Error('File not found');
    }
    
    const fileData = fileSnap.data() as Omit<UploadedFile, 'id'>;
    
    if (fileData.userId !== userId) {
      throw new Error('You do not have permission to share this file');
    }
    
    // Create share permissions for each email
    const shareIds: string[] = [];
    
    for (const email of sharedEmails) {
      const shareData: Omit<SharePermission, 'id'> = {
        fileId,
        createdBy: userId,
        sharedWith: email.toLowerCase().trim(),
        createdAt: serverTimestamp(),
        accessType,
        accessCount: 0,
        ...(expiresAt && { expiresAt }),
        ...(password && { password })
      };
      
      const shareRef = await addDoc(collection(db, sharingCollection), shareData);
      shareIds.push(shareRef.id);
    }
    
    return shareIds;
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
}

/**
 * Make a file publicly accessible
 */
export async function makeFilePublic(
  fileId: string,
  userId: string,
  accessType: 'view' | 'download' = 'view',
  expiresAt?: Date,
  password?: string
): Promise<string> {
  try {
    // Create a public share
    const shareIds = await shareFileWithUsers(
      fileId,
      userId,
      ['public'],
      accessType,
      expiresAt,
      password
    );
    
    // Also update the file record to mark it as public
    const fileRef = doc(db, filesCollection, fileId);
    await updateDoc(fileRef, {
      isPublic: true,
      updatedAt: serverTimestamp()
    });
    
    return shareIds[0]; // Return the share ID
  } catch (error) {
    console.error('Error making file public:', error);
    throw error;
  }
}

/**
 * Revoke sharing for a specific permission
 */
export async function revokeSharing(shareId: string, userId: string): Promise<void> {
  try {
    const shareRef = doc(db, sharingCollection, shareId);
    const shareSnap = await getDoc(shareRef);
    
    if (!shareSnap.exists()) {
      throw new Error('Share permission not found');
    }
    
    const shareData = shareSnap.data() as SharePermission;
    
    // Verify ownership
    if (shareData.createdBy !== userId) {
      throw new Error('You do not have permission to revoke this share');
    }
    
    // Delete the share permission
    await deleteDoc(shareRef);
    
    // If this was a public share, update the file record
    if (shareData.sharedWith === 'public') {
      const fileRef = doc(db, filesCollection, shareData.fileId);
      const fileSnap = await getDoc(fileRef);
      
      if (fileSnap.exists()) {
        // Check if there are any other public shares for this file
        const otherPublicShares = query(
          collection(db, sharingCollection),
          where('fileId', '==', shareData.fileId),
          where('sharedWith', '==', 'public')
        );
        
        const publicSharesSnap = await getDocs(otherPublicShares);
        
        if (publicSharesSnap.empty) {
          // No other public shares, mark file as not public
          await updateDoc(fileRef, {
            isPublic: false,
            updatedAt: serverTimestamp()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error revoking file share:', error);
    throw error;
  }
}

/**
 * Get files shared with a specific email
 */
export async function getFilesSharedWithUser(email: string): Promise<{shareInfo: SharePermission, file: UploadedFile}[]> {
  try {
    const q = query(
      collection(db, sharingCollection),
      where('sharedWith', '==', email.toLowerCase().trim())
    );
    
    const shareSnap = await getDocs(q);
    const sharedFiles: {shareInfo: SharePermission, file: UploadedFile}[] = [];
    
    // Get each file referenced in the share
    for (const shareDoc of shareSnap.docs) {
      const shareData = { id: shareDoc.id, ...shareDoc.data() } as SharePermission;
      
      // Check if sharing has expired
      if (shareData.expiresAt) {
        const expiryDate = new Date(shareData.expiresAt.seconds * 1000);
        if (new Date() > expiryDate) {
          continue; // Skip expired shares
        }
      }
      
      const fileRef = doc(db, filesCollection, shareData.fileId);
      const fileSnap = await getDoc(fileRef);
      
      if (fileSnap.exists()) {
        const fileData = { id: fileSnap.id, ...fileSnap.data() } as UploadedFile;
        sharedFiles.push({
          shareInfo: shareData,
          file: fileData
        });
      }
    }
    
    return sharedFiles;
  } catch (error) {
    console.error('Error getting shared files:', error);
    throw error;
  }
}

/**
 * Get all files shared by a user
 */
export async function getUserSharedFiles(userId: string): Promise<{shareInfo: SharePermission, file: UploadedFile}[]> {
  try {
    const q = query(
      collection(db, sharingCollection),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const shareSnap = await getDocs(q);
    const sharedFiles: {shareInfo: SharePermission, file: UploadedFile}[] = [];
    
    // Get each file referenced in the share
    for (const shareDoc of shareSnap.docs) {
      const shareData = { id: shareDoc.id, ...shareDoc.data() } as SharePermission;
      
      const fileRef = doc(db, filesCollection, shareData.fileId);
      const fileSnap = await getDoc(fileRef);
      
      if (fileSnap.exists()) {
        const fileData = { id: fileSnap.id, ...fileSnap.data() } as UploadedFile;
        sharedFiles.push({
          shareInfo: shareData,
          file: fileData
        });
      }
    }
    
    return sharedFiles;
  } catch (error) {
    console.error('Error getting user shared files:', error);
    throw error;
  }
}

/**
 * Record access to a shared file
 */
export async function recordShareAccess(shareId: string): Promise<void> {
  try {
    const shareRef = doc(db, sharingCollection, shareId);
    const shareSnap = await getDoc(shareRef);
    
    if (shareSnap.exists()) {
      await updateDoc(shareRef, {
        accessCount: (shareSnap.data().accessCount || 0) + 1,
        lastAccessed: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error recording share access:', error);
    throw error;
  }
}

/**
 * Verify a share password
 */
export async function verifySharePassword(shareId: string, password: string): Promise<boolean> {
  try {
    const shareRef = doc(db, sharingCollection, shareId);
    const shareSnap = await getDoc(shareRef);
    
    if (!shareSnap.exists()) {
      return false;
    }
    
    const shareData = shareSnap.data() as SharePermission;
    
    // If no password set, or passwords match
    return !shareData.password || shareData.password === password;
  } catch (error) {
    console.error('Error verifying share password:', error);
    return false;
  }
}

/**
 * Check if sharing has expired
 */
export function isShareExpired(shareInfo: SharePermission): boolean {
  if (!shareInfo.expiresAt) return false;
  
  const expiryDate = shareInfo.expiresAt instanceof Date 
    ? shareInfo.expiresAt 
    : new Date(shareInfo.expiresAt.seconds * 1000);
  
  return new Date() > expiryDate;
} 