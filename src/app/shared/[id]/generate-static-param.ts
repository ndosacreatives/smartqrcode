// This generates a dummy shared ID for static build
// In production, the actual IDs will come from the database/API at runtime
export async function generateStaticParams() {
  // Return a placeholder ID for static build
  return [{ id: 'placeholder' }];
}

// This is necessary to tell Next.js that this is a dynamic route
// that should be generated at runtime, despite having static placeholder
export const dynamicParams = true; 