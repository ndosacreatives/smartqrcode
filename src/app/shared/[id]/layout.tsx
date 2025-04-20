import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared File',
  description: 'View or download shared file',
};

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 