import { db } from '@/lib/firebase/config';
import { collection, getDocs, getDoc, doc, query, where, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { ScanLocation, QRCodeData, AnalyticsData as AnalyticsDataFromTypes } from '@/lib/types';

// Define the structure for scan data used within this service
interface InternalScanData {
  timestamp: Timestamp;
  location?: ScanLocation;
  deviceInfo?: {
    type?: string;
  };
  referrer?: string;
  ipAddress?: string;
  userId: string;
}

// Keep the local AnalyticsData interface definition
export interface AnalyticsData {
  totalScans: number;
  uniqueDevices: number;
  mostActiveCountry: string;
  topReferrer: string;
  scansByDay: Record<string, number>;
  scansByCountry: Record<string, number>;
  deviceBreakdown: Record<string, number>;
  scansByReferrer: Record<string, number>;
  scansByLocation: Record<string, number>;
  scanHistory: InternalScanData[]; // Correct type for history
}

/**
 * Get scan analytics for a specific period
 */
export async function getAnalytics(
  userId: string,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
  startDate?: Date
): Promise<AnalyticsData> {
  try {
    // Define the time range based on the period
    const endDate = new Date();
    const calcStartDate = startDate || new Date();
    
    if (!startDate) {
      switch (period) {
        case 'daily':
          calcStartDate.setDate(calcStartDate.getDate() - 1);
          break;
        case 'weekly':
          calcStartDate.setDate(calcStartDate.getDate() - 7);
          break;
        case 'monthly':
          calcStartDate.setMonth(calcStartDate.getMonth() - 1);
          break;
        case 'yearly':
          calcStartDate.setFullYear(calcStartDate.getFullYear() - 1);
          break;
      }
    }

    // Get all QR codes for this user
    const qrCodesQuery = query(
      collection(db, 'dynamicQRCodes'),
      where('userId', '==', userId),
      where('trackingEnabled', '==', true)
    );
    
    const qrCodesSnapshot = await getDocs(qrCodesQuery);
    const qrCodes = qrCodesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as QRCodeData);
    
    // Process scan data from all QR codes
    let totalScans = 0;
    const scansByDay: Record<string, number> = {};
    const scansByCountry: Record<string, number> = {};
    const deviceBreakdown = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      other: 0
    };
    const scansByReferrer: Record<string, number> = {};
    const uniqueIPs: Set<string> = new Set();
    const scansByLocation: Record<string, number> = {};
    
    // Format date for consistent grouping
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Initialize days in range for the chart
    let currentDate = new Date(calcStartDate);
    while (currentDate <= endDate) {
      scansByDay[formatDate(currentDate)] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Process each QR code's scan data
    for (const qrCode of qrCodes) {
      if (!qrCode.scanLocations) continue;
      
      for (const scan of qrCode.scanLocations) {
        let scanTimestamp: Date;
        
        if (scan.timestamp instanceof Timestamp) {
          scanTimestamp = scan.timestamp.toDate();
        } else if (typeof scan.timestamp === 'object' && scan.timestamp.seconds) {
          scanTimestamp = new Date(scan.timestamp.seconds * 1000);
        } else if (scan.timestamp) {
          scanTimestamp = new Date(scan.timestamp);
        } else {
          continue; // Skip if no valid timestamp
        }
        
        // Skip if outside date range
        if (scanTimestamp < calcStartDate || scanTimestamp > endDate) {
          continue;
        }
        
        totalScans++;
        
        // Add to unique IPs
        if (scan.ip) {
          uniqueIPs.add(scan.ip);
        }
        
        // Count by day
        const dateStr = formatDate(scanTimestamp);
        scansByDay[dateStr] = (scansByDay[dateStr] || 0) + 1;
        
        // Count by country
        if (scan.country) {
          scansByCountry[scan.country] = (scansByCountry[scan.country] || 0) + 1;
        }
        
        // Count by device type
        if (scan.device) {
          const deviceType = scan.device.toLowerCase();
          if (deviceType.includes('mobile')) {
            deviceBreakdown.mobile += 1;
          } else if (deviceType.includes('tablet')) {
            deviceBreakdown.tablet += 1;
          } else if (deviceType.includes('desktop')) {
            deviceBreakdown.desktop += 1;
          } else {
            deviceBreakdown.other += 1;
          }
        }
        
        // Count by referrer
        if (scan.referrer) {
          // Extract domain from referrer
          try {
            const url = new URL(scan.referrer);
            const domain = url.hostname;
            scansByReferrer[domain] = (scansByReferrer[domain] || 0) + 1;
          } catch {
            scansByReferrer[scan.referrer] = (scansByReferrer[scan.referrer] || 0) + 1;
          }
        }
        
        // Track scans by location (city, country)
        if (scan.city || scan.country) {
          const locationKey = `${scan.city || 'Unknown'}, ${scan.country || 'Unknown'}`;
          scansByLocation[locationKey] = (scansByLocation[locationKey] || 0) + 1;
        }
      }
    }
    
    // Convert scansByDay to array format for charts
    const scansByDayArray = Object.entries(scansByDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    // Get top locations
    const topLocations = Object.entries(scansByCountry)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Get top referrers
    const topReferrers = Object.entries(scansByReferrer)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Find most active country
    const mostActiveCountry = Object.entries(scansByCountry).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

    // Find top referrer
    const topReferrer = Object.entries(scansByReferrer).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

    // Get scan history (limit to recent 100 for performance)
    const historyQuery = query(
      collection(db, 'scans'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const historySnapshot = await getDocs(historyQuery);
    const scanHistory = historySnapshot.docs.map(doc => doc.data() as InternalScanData);

    return {
      totalScans,
      uniqueDevices: uniqueIPs.size,
      mostActiveCountry,
      topReferrer,
      scansByDay: scansByDay,
      scansByCountry,
      deviceBreakdown,
      scansByReferrer,
      scansByLocation,
      scanHistory
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
}

/**
 * Get a summary of user's QR code performance
 */
export async function getQRCodePerformanceSummary(userId: string): Promise<{
  totalQRCodes: number;
  totalScans: number;
  topPerformingCodes: Array<{
    id: string;
    name: string;
    scans: number;
    conversionRate?: number;
  }>;
}> {
  try {
    const qrCodesQuery = query(
      collection(db, 'dynamicQRCodes'),
      where('userId', '==', userId),
      orderBy('scans', 'desc'),
      limit(10)
    );
    
    const snapshot = await getDocs(qrCodesQuery);
    const codes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as QRCodeData);
    
    const totalQRCodes = codes.length;
    const totalScans = codes.reduce((sum, code) => sum + (code.scans || 0), 0);
    
    const topPerformingCodes = codes
      .filter(code => code.scans > 0)
      .map(code => ({
        id: code.id,
        name: code.name,
        scans: code.scans || 0,
        // Could calculate conversion rate if we tracked goal completions
      }))
      .slice(0, 5);
    
    return {
      totalQRCodes,
      totalScans,
      topPerformingCodes
    };
  } catch (error) {
    console.error('Error getting QR code performance summary:', error);
    throw error;
  }
}

/**
 * Fetch detailed analytics data for a specific user's QR codes or barcodes.
 * @param userId The ID of the user whose analytics data to fetch.
 * @param startDate Optional start date for filtering scan data.
 * @param endDate Optional end date for filtering scan data.
 */
export async function getAnalyticsData(
  userId: string,
  startDate?: Date | null,
  endDate?: Date | null
): Promise<AnalyticsData> {
  try {
    // Build the base query for the scans collection
    let scansQuery = query(collection(db, "scans"), where("userId", "==", userId));

    // Add date filters if provided
    if (startDate) {
      scansQuery = query(scansQuery, where("timestamp", ">=", Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      // Add 1 day to endDate to make it inclusive
      const inclusiveEndDate = new Date(endDate);
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
      scansQuery = query(scansQuery, where("timestamp", "<", Timestamp.fromDate(inclusiveEndDate)));
    }

    // Execute the query to get scan documents
    const querySnapshot = await getDocs(scansQuery);
    const scans = querySnapshot.docs.map(doc => doc.data() as InternalScanData);

    // Calculate analytics metrics
    const totalScans = scans.length;
    const scansByDay: Record<string, number> = {};
    const scansByCountry: Record<string, number> = {};
    const deviceBreakdown: Record<string, number> = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      other: 0
    };
    const scansByReferrer: Record<string, number> = {};
    const uniqueIPs = new Set<string>();
    const scansByLocation: Record<string, number> = {};

    scans.forEach(scan => {
      // Format date as YYYY-MM-DD
      const date = scan.timestamp.toDate().toISOString().split('T')[0];
      scansByDay[date] = (scansByDay[date] || 0) + 1;

      // Track scans by country
      const country = scan.location?.country || "Unknown";
      scansByCountry[country] = (scansByCountry[country] || 0) + 1;

      // Track device types
      const device = scan.deviceInfo?.type || "Unknown";
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;

      // Track referrers
      const referrer = scan.referrer || "Direct";
      scansByReferrer[referrer] = (scansByReferrer[referrer] || 0) + 1;

      // Track unique IPs (as proxy for unique devices)
      if (scan.ipAddress) {
        uniqueIPs.add(scan.ipAddress);
      }
      
      // Track scans by location (city, country)
      if (scan.location) {
        const locationKey = `${scan.location.city || 'Unknown'}, ${scan.location.country || 'Unknown'}`;
        scansByLocation[locationKey] = (scansByLocation[locationKey] || 0) + 1;
      }
    });

    // Find most active country
    const mostActiveCountry = Object.entries(scansByCountry).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

    // Find top referrer
    const topReferrer = Object.entries(scansByReferrer).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

    // Get scan history (limit to recent 100 for performance)
    const historyQuery = query(scansQuery, orderBy("timestamp", "desc"));
    const historySnapshot = await getDocs(historyQuery);
    const scanHistory = historySnapshot.docs.map(doc => doc.data() as InternalScanData);

    return {
      totalScans,
      uniqueDevices: uniqueIPs.size,
      mostActiveCountry,
      topReferrer,
      scansByDay,
      scansByCountry,
      deviceBreakdown,
      scansByReferrer,
      scansByLocation,
      scanHistory,
    };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    throw error;
  }
} 