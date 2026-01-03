import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GuardianList from '@/components/guardian-list';
import { Button } from '@/components/ui/button';

export default function GuardiansPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
            <Link href="/keychain">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Manage Guardians
        </h1>
      </header>
      <main className="flex-1 p-4 sm:px-6 sm:py-0">
        <p className="text-muted-foreground mb-4">
          Add or remove the trusted contacts you want to alert in an emergency.
        </p>
        <GuardianList />
      </main>
    </div>
  );
}
