import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, deleteDoc, increment, arrayUnion, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { QRCodeData, ScanLocation } from '@/lib/types';

// Base collection reference
const qrCodesCollection = 'dynamicQRCodes';

/**
 * Create a new dynamic QR code
 */
export async function createDynamicQRCode(qrCodeData: Omit<QRCodeData, 'id' | 'scans' | 'createdAt'>): Promise<string> {
  try {
    const data = {
      ...qrCodeData,
      scans: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, qrCodesCollection), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating dynamic QR code:', error);
    throw error;
  }
}

/**
 * Get a dynamic QR code by ID
 */
export async function getDynamicQRCode(qrCodeId: string): Promise<QRCodeData | null> {
  try {
    const docRef = doc(db, qrCodesCollection, qrCodeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as QRCodeData;
    }

    return null;
  } catch (error) {
    console.error('Error getting dynamic QR code:', error);
    throw error;
  }
}

/**
 * Get all dynamic QR codes for a user
 */
export async function getUserQRCodes(userId: string): Promise<QRCodeData[]> {
  try {
    const q = query(
      collection(db, qrCodesCollection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QRCodeData));
  } catch (error) {
    console.error('Error getting user QR codes:', error);
    throw error;
  }
}

/**
 * Update a dynamic QR code
 */
export async function updateDynamicQRCode(qrCodeId: string, data: Partial<QRCodeData>): Promise<void> {
  try {
    const docRef = doc(db, qrCodesCollection, qrCodeId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating dynamic QR code:', error);
    throw error;
  }
}

/**
 * Delete a dynamic QR code
 */
export async function deleteDynamicQRCode(qrCodeId: string): Promise<void> {
  try {
    // Check if there's a file to delete as well
    const qrCode = await getDynamicQRCode(qrCodeId);
    if (qrCode?.fileUrl) {
      // Extract the file path from the URL
      const storage = getStorage();
      const fileRef = ref(storage, `uploads/${qrCode.userId}/${qrCodeId}/${qrCode.fileName}`);
      try {
        await deleteObject(fileRef);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with QR code deletion even if file deletion fails
      }
    }

    await deleteDoc(doc(db, qrCodesCollection, qrCodeId));
  } catch (error) {
    console.error('Error deleting dynamic QR code:', error);
    throw error;
  }
}

/**
 * Record a QR code scan
 */
export async function recordQRCodeScan(qrCodeId: string, scanInfo: Partial<ScanLocation>): Promise<void> {
  try {
    const docRef = doc(db, qrCodesCollection, qrCodeId);
    const scanLocation: ScanLocation = {
      timestamp: serverTimestamp(),
      ...scanInfo
    };

    await updateDoc(docRef, {
      scans: increment(1),
      lastScan: serverTimestamp(),
      scanLocations: arrayUnion(scanLocation)
    });
  } catch (error) {
    console.error('Error recording QR code scan:', error);
    throw error;
  }
}

/**
 * Upload a file and associate it with a QR code
 */
export async function uploadFileForQRCode(
  userId: string,
  qrCodeId: string,
  file: File
): Promise<{ downloadUrl: string; fileType: string; fileName: string }> {
  try {
    const storage = getStorage();
    const filePath = `uploads/${userId}/${qrCodeId}/${file.name}`;
    const fileRef = ref(storage, filePath);
    
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    
    // Update the QR code with file information
    const docRef = doc(db, qrCodesCollection, qrCodeId);
    await updateDoc(docRef, {
      fileUrl: downloadUrl,
      fileType: file.type,
      fileName: file.name,
      updatedAt: serverTimestamp()
    });
    
    return {
      downloadUrl,
      fileType: file.type,
      fileName: file.name
    };
  } catch (error) {
    console.error('Error uploading file for QR code:', error);
    throw error;
  }
}

/**
 * Get QR code statistics
 */
export async function getQRCodeStats(userId: string): Promise<{ 
  totalCodes: number;
  totalScans: number;
  averageScansPerCode: number;
  mostScannedCode: Partial<QRCodeData> | null;
}> {
  try {
    const q = query(
      collection(db, qrCodesCollection),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const codes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QRCodeData));
    
    const totalCodes = codes.length;
    const totalScans = codes.reduce((sum, code) => sum + (code.scans || 0), 0);
    const averageScansPerCode = totalCodes > 0 ? totalScans / totalCodes : 0;
    
    // Find the most scanned code
    let mostScannedCode: Partial<QRCodeData> | null = null;
    let maxScans = 0;
    
    codes.forEach(code => {
      if ((code.scans || 0) > maxScans) {
        maxScans = code.scans || 0;
        mostScannedCode = {
          id: code.id,
          name: code.name,
          content: code.content,
          type: code.type,
          scans: code.scans
        };
      }
    });
    
    return {
      totalCodes,
      totalScans,
      averageScansPerCode,
      mostScannedCode
    };
  } catch (error) {
    console.error('Error getting QR code stats:', error);
    throw error;
  }
} 