import GuardianKeychain from '@/components/guardian-keychain';

export default function KeychainPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <GuardianKeychain />
    </main>
  );
}
