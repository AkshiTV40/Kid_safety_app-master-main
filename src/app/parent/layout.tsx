import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PrivacyConsent from '../../components/privacy-consent';
import NotificationConsent from '../../components/notification-consent';
import NativeFcmConsent from '../../components/native-fcm-consent';

export const metadata = { title: 'Parent Portal' };

export default function ParentLayout({ children }: { children: React.ReactNode }){
  return (
    <div className="min-h-screen bg-gray-50">
      <PrivacyConsent />
      <NotificationConsent userId={'parent-1'} />
      <NativeFcmConsent userId={'parent-1'} />
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="font-semibold text-lg">Parent</h1>
          </div>
          <nav className="flex gap-3">
            <Link className="text-sm text-blue-600" href="/parent/contacts">Contacts</Link>
            <Link className="text-sm text-blue-600" href="/parent/location">Location</Link>
            <Link className="text-sm text-blue-600" href="/parent/help">Help</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
