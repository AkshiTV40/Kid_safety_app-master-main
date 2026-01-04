'use client';

import GuardianKeychain from '@/components/guardian-keychain';

export default function SOSPage() {
  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <GuardianKeychain />
    </div>
  );
}