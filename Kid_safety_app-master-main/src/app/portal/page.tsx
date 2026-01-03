import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Shield, MapPin, AlertTriangle, Users, Globe, Lock, Smartphone, ArrowRight } from 'lucide-react';

export default function PortalPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold text-lg">Guardian Keychain</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link
              href="/keychain"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="container relative px-4 md:px-6 max-w-screen-2xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                  Your Personal Safety Companion
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
                  Guardian Keychain provides peace of mind with real-time location sharing, AI-powered threat detection, and instant access to your trusted guardians.
                </p>
              </div>
              <div className="flex flex-col gap-4 min-[400px]:flex-row">
                <Link
                  href="/keychain"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors gap-2"
                >
                  Launch App <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium hover:bg-accent transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative h-96 md:h-full rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-4 p-8">
                <Shield className="h-24 w-24 text-primary opacity-80" />
                <p className="text-center text-muted-foreground">
                  Stay Safe, Stay Connected
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 border-t bg-muted/50">
        <div className="container px-4 md:px-6 max-w-screen-2xl">
          <div className="space-y-8">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Powerful Safety Features
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Everything you need to stay safe and keep your loved ones informed
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-none bg-background hover:shadow-lg transition-shadow">
                <CardHeader>
                  <MapPin className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Live Location Sharing</CardTitle>
                  <CardDescription>Share your real-time location with trusted guardians</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Get accurate GPS tracking and instant location updates. Your guardians always know where you are.
                </CardContent>
              </Card>

              <Card className="border-none bg-background hover:shadow-lg transition-shadow">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>AI Threat Detection</CardTitle>
                  <CardDescription>Advanced AI monitors for potential dangers</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  AI-powered analysis detects unusual patterns and potential threats automatically.
                </CardContent>
              </Card>

              <Card className="border-none bg-background hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Lock className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>End-to-End Encryption</CardTitle>
                  <CardDescription>Your data is always secure and private</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Military-grade encryption ensures your location and personal data stay private.
                </CardContent>
              </Card>

              <Card className="border-none bg-background hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Guardian Network</CardTitle>
                  <CardDescription>Connect with trusted contacts instantly</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Build your safety network with family and friends who care about you.
                </CardContent>
              </Card>

              <Card className="border-none bg-background hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Smartphone className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Quick Alert System</CardTitle>
                  <CardDescription>Send emergency alerts with one tap</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Instantly notify your guardians in case of emergency with a single action.
                </CardContent>
              </Card>

              <Card className="border-none bg-background hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Globe className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Offline Support</CardTitle>
                  <CardDescription>Works even without internet connection</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Progressive web app technology keeps you safe even in offline mode.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 max-w-screen-2xl">
          <div className="space-y-8">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Simple steps to get started with Guardian Keychain
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { num: '1', title: 'Sign Up', desc: 'Create your account in seconds' },
                { num: '2', title: 'Add Guardians', desc: 'Invite trusted contacts' },
                { num: '3', title: 'Enable Sharing', desc: 'Start sharing your location' },
                { num: '4', title: 'Stay Safe', desc: 'Get alerts and peace of mind' },
              ].map((step) => (
                <div key={step.num} className="relative">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                      {step.num}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 border-t bg-muted/50">
        <div className="container px-4 md:px-6 max-w-screen-2xl">
          <div className="space-y-8">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Choose the plan that works best for you
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>For personal use</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-2xl font-bold">Free</div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Up to 3 guardians
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Live location sharing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Basic alerts
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline">Get Started</Button>
                </CardContent>
              </Card>

              <Card className="border-primary border-2">
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>Most popular</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-2xl font-bold">$4.99<span className="text-lg text-muted-foreground">/mo</span></div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Unlimited guardians
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> AI threat detection
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Advanced analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Priority support
                    </li>
                  </ul>
                  <Button className="w-full">Start Free Trial</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For organizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-2xl font-bold">Custom</div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Custom features
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Dedicated support
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> SLA guarantees
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Custom integration
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline">Contact Sales</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-16 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 max-w-screen-2xl text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Ready to Stay Safe?</h2>
            <p className="mx-auto max-w-2xl text-lg opacity-90">
              Join thousands of people who trust Guardian Keychain for their safety
            </p>
            <Link
              href="/keychain"
              className="inline-flex h-11 items-center justify-center rounded-md bg-background px-8 text-base font-medium text-primary hover:bg-background/90 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t py-8 md:py-12 bg-muted/50">
        <div className="container px-4 md:px-6 max-w-screen-2xl">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Logo className="h-5 w-5" />
                <span className="font-bold">Guardian Keychain</span>
              </div>
              <p className="text-sm text-muted-foreground">Your personal safety companion</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="/keychain" className="text-muted-foreground hover:text-foreground">App</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Terms</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Guardian Keychain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
