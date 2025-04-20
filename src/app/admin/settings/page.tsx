'use client';

import React from 'react';
import SettingsForm from '@/components/admin/SettingsForm';
import IntegrationsForm from '@/components/admin/IntegrationsForm';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Application Settings</h1>
      <SettingsForm />
      <IntegrationsForm />
    </div>
  );
} 