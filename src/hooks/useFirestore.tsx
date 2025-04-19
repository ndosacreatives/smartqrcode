import { useState, useEffect } from 'react';
import { where, orderBy, limit, QueryConstraint, DocumentData } from 'firebase/firestore';
import { DatabaseService, COLLECTIONS } from '@/lib/DatabaseService';

/**
 * Custom hook for retrieving a single document with real-time updates
 */
export function useDocument<T extends DocumentData>(
  collectionName: string, 
  documentId: string | null | undefined,
  options = { listen: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Function to fetch the document once
    const fetchDocument = async () => {
      try {
        const doc = await DatabaseService.getDocument<T>(collectionName, documentId);
        setData(doc);
      } catch (err) {
        console.error(`Error fetching document ${collectionName}/${documentId}:`, err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    // If listen option is true, set up a real-time listener
    if (options.listen) {
      const unsubscribe = DatabaseService.listenToDocument<T>(
        collectionName, 
        documentId, 
        (doc) => {
          setData(doc);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      // Otherwise just fetch once
      fetchDocument();
    }
  }, [collectionName, documentId, options.listen]);

  // Function to refresh the data on demand
  const refreshData = async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      // Force bypass cache by setting useCache to false
      const doc = await DatabaseService.getDocument<T>(
        collectionName, 
        documentId, 
        { useCache: false }
      );
      setData(doc);
    } catch (err) {
      console.error(`Error refreshing document ${collectionName}/${documentId}:`, err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  // Function to update the document
  const updateDocument = async (updates: Partial<T>) => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      await DatabaseService.updateDocument<Partial<T>>(
        collectionName,
        documentId,
        updates
      );
      
      // If not listening for updates, manually refresh
      if (!options.listen) {
        await refreshData();
      }
      
      return true;
    } catch (err) {
      console.error(`Error updating document ${collectionName}/${documentId}:`, err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refreshData, updateDocument };
}

/**
 * Custom hook for retrieving a collection of documents with real-time updates
 */
export function useCollection<T extends DocumentData>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = [],
  options = { listen: true }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Function to fetch the collection once
    const fetchCollection = async () => {
      try {
        const docs = await DatabaseService.queryDocuments<T>(
          collectionName,
          queryConstraints
        );
        setData(docs);
      } catch (err) {
        console.error(`Error fetching collection ${collectionName}:`, err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    // If listen option is true, set up a real-time listener
    if (options.listen) {
      const unsubscribe = DatabaseService.listenToQuery<T>(
        collectionName,
        queryConstraints,
        (docs) => {
          setData(docs);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      // Otherwise just fetch once
      fetchCollection();
    }
  }, [collectionName, JSON.stringify(queryConstraints), options.listen]);

  // Function to refresh the data on demand
  const refreshData = async () => {
    setLoading(true);
    try {
      const docs = await DatabaseService.queryDocuments<T>(
        collectionName,
        queryConstraints
      );
      setData(docs);
    } catch (err) {
      console.error(`Error refreshing collection ${collectionName}:`, err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refreshData };
}

// Define custom types for strongly typed hooks
interface UserData extends DocumentData {
  id: string;
  email: string;
  displayName: string;
  role: string;
  subscriptionTier: string;
  [key: string]: any;
}

interface CodeData extends DocumentData {
  id: string;
  userId: string;
  name: string;
  content: string;
  type: 'qrcode' | 'barcode';
  [key: string]: any;
}

interface SubscriptionData extends DocumentData {
  id: string;
  userId: string;
  status: string;
  plan: string;
  provider: string;
  [key: string]: any;
}

/**
 * Custom hook for retrieving user data with real-time updates
 */
export function useUserData(userId: string | null | undefined) {
  return useDocument<UserData>(COLLECTIONS.USERS, userId);
}

/**
 * Custom hook for retrieving user's codes/QR codes
 */
export function useUserCodes(userId: string | null | undefined, options = { listen: true }) {
  const constraints: QueryConstraint[] = [];
  
  if (userId) {
    constraints.push(where('userId', '==', userId));
  }
  
  constraints.push(orderBy('createdAt', 'desc'));
  
  return useCollection<CodeData>(COLLECTIONS.CODES, constraints, options);
}

/**
 * Custom hook for retrieving user subscriptions
 */
export function useUserSubscription(userId: string | null | undefined) {
  const constraints: QueryConstraint[] = [];
  
  if (userId) {
    constraints.push(where('userId', '==', userId));
    constraints.push(where('status', '==', 'active'));
    constraints.push(limit(1));
  }
  
  return useCollection<SubscriptionData>(COLLECTIONS.SUBSCRIPTIONS, constraints);
} 