"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Smartphone, ShieldCheck, Zap, Users } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const [rpiStatus, setRpiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const check = async () => {
      const RPI_URL = process.env.NEXT_PUBLIC_RPI_URL || "http://localhost:8000";
      try {
        const res = await fetch(`${RPI_URL}/health`);
        setRpiStatus(res.ok ? 'connected' : 'disconnected');
      } catch {
        setRpiStatus('disconnected');
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo className="h-6 w-6" />
          <span className="sr-only">Guardian Keychain</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <span className="text-sm text-muted-foreground">RPi: {rpiStatus}</span>
          <Link href="/location" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Location
          </Link>
          <Link href="/videos" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Videos
          </Link>
          <Link href="/sos" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            SOS
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Your Personal Safety Companion
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Guardian Keychain provides peace of mind with live location sharing, AI-powered threat detection, and
                    an instant connection to your loved ones.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/keychain"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Open App
                  </Link>
                </div>
              </div>
              <Image
                src="https://picsum.photos/seed/101/600/600"
                width="600"
                height="600"
                alt="Guardian Keychain App"
                data-ai-hint="app interface mobile"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Total Peace of Mind</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our app is packed with features designed to keep you safe and connected when it matters most.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-4 lg:gap-10">
              <div className="grid gap-1 text-center">
                 <div className="flex justify-center">
                    <Smartphone className="h-10 w-10 text-primary" />
                 </div>
                <h3 className="text-xl font-bold">Location Sharing</h3>
                <p className="text-muted-foreground">
                  Share your precise GPS location with your designated guardians.
                </p>
              </div>
               <div className="grid gap-1 text-center">
                <div className="flex justify-center">
                    <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Manage Guardians</h3>
                <p className="text-muted-foreground">
                  Easily add and manage your list of trusted emergency contacts.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Guardian Connection</h3>
                <p className="text-muted-foreground">
                  Instantly alert your trusted contacts with a single tap.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="flex justify-center">
                    <Zap className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI-Powered Analysis</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes surroundings for potential threats, providing an extra layer of security.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Guardian Keychain. All rights reserved.</p>
      </footer>
    </div>
  );
}
