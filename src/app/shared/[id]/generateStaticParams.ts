// This generates a dummy shared ID for static build
// In production, the actual IDs will come from the database/API at runtime
export async function generateStaticParams() {
  // No pre-rendered params; all handled at runtime via fallback page
  return [];
}

// This is necessary to tell Next.js that this is a dynamic route
// that should be generated at runtime, despite having static placeholder
export const dynamicParams = true; 