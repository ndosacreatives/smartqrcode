import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, deleteDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { BarcodeData } from '@/lib/types';

// Base collection reference
const barcodesCollection = 'enhancedBarcodes';

/**
 * Create a new enhanced barcode
 */
export async function createEnhancedBarcode(barcodeData: Omit<BarcodeData, 'id' | 'createdAt'>): Promise<string> {
  try {
    const data = {
      ...barcodeData,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, barcodesCollection), data);
    return docRef.id;
  } catch (error) {
    console.error('Error creating enhanced barcode:', error);
    throw error;
  }
}

/**
 * Get an enhanced barcode by ID
 */
export async function getEnhancedBarcode(barcodeId: string): Promise<BarcodeData | null> {
  try {
    const docRef = doc(db, barcodesCollection, barcodeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BarcodeData;
    }

    return null;
  } catch (error) {
    console.error('Error getting enhanced barcode:', error);
    throw error;
  }
}

/**
 * Get all enhanced barcodes for a user
 */
export async function getUserBarcodes(userId: string): Promise<BarcodeData[]> {
  try {
    const q = query(
      collection(db, barcodesCollection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BarcodeData));
  } catch (error) {
    console.error('Error getting user barcodes:', error);
    throw error;
  }
}

/**
 * Update an enhanced barcode
 */
export async function updateEnhancedBarcode(barcodeId: string, data: Partial<BarcodeData>): Promise<void> {
  try {
    const docRef = doc(db, barcodesCollection, barcodeId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating enhanced barcode:', error);
    throw error;
  }
}

/**
 * Delete an enhanced barcode
 */
export async function deleteEnhancedBarcode(barcodeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, barcodesCollection, barcodeId));
  } catch (error) {
    console.error('Error deleting enhanced barcode:', error);
    throw error;
  }
}

/**
 * Get enhanced barcode by content
 * Useful for looking up product information when scanning a barcode
 */
export async function getBarcodeByContent(content: string): Promise<BarcodeData | null> {
  try {
    const q = query(
      collection(db, barcodesCollection),
      where('content', '==', content),
      where('isPublic', '==', true),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as BarcodeData;
  } catch (error) {
    console.error('Error getting barcode by content:', error);
    throw error;
  }
}

/**
 * Generate a product landing page URL for an enhanced barcode
 */
export function getProductPageUrl(barcodeId: string): string {
  // This would typically point to a dynamic route in your Next.js app
  return `${window.location.origin}/barcode/${barcodeId}`;
} 