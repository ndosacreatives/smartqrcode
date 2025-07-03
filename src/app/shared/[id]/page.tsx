// Server wrapper; interactive logic is in SharedFileClient (use client)

import SharedFileClient from './SharedFileClient';

interface PageProps { params: { id: string } }

export default function Page({ params }: PageProps) {
  return <SharedFileClient id={params.id} />;
}

export async function generateStaticParams() {
  return [];
}
  