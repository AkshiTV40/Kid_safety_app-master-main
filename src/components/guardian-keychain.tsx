
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, MapPin, ShieldAlert, Wifi, BatteryFull, Loader2, Navigation, VideoOff, Users, AlertCircle, Video, Eye } from 'lucide-react';
import { Logo } from '@/components/logo';
import { runPanicDetection } from '@/app/actions';
import type { DetectPanicAndAlertOutput } from '@/ai/flows/detect-panic-and-alert';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ChildControls from '@/app/keychain/components/ChildControls';

type Location = {
  latitude: number;
  longitude: number;
} | null;

const AlertLevelBadge = ({ level }: { level: 'low' | 'medium' | 'high' }) => {
  const levelStyles = {
    low: 'bg-green-500 hover:bg-green-500/90',
    medium: 'bg-yellow-500 hover:bg-yellow-500/90',
    high: 'bg-red-600 hover:bg-red-600/90',
  };
  return (
    <Badge className={`${levelStyles[level]} text-white`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Alert
    </Badge>
  );
};

export default function GuardianKeychain() {
  // Replace previous "video call" flow with direct emergency call + recording
  const [isCalling911, setIsCalling911] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Location>(null);
  const [panicInfo, setPanicInfo] = useState<DetectPanicAndAlertOutput | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [hasGpsPermission, setHasGpsPermission] = useState<boolean | undefined>(undefined);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const [guardianCount, setGuardianCount] = useState(0);

  const analysisInterval = useRef<NodeJS.Timeout | null>(null);
  const locationWatcher = useRef<number | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    const storedGuardians = localStorage.getItem('guardians');
    if (storedGuardians) {
      setGuardianCount(JSON.parse(storedGuardians).length);
    }
    
    const handleStorageChange = () => {
        const storedGuardians = localStorage.getItem('guardians');
        setGuardianCount(storedGuardians ? JSON.parse(storedGuardians).length : 0);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        clearInterval(timer);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Ensure we can obtain camera+audio for recordings
  const requestMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      setHasCameraPermission(true);
      return stream;
    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera/Mic Access Denied',
        description: 'Please enable camera and microphone permissions to record video.',
      });
      return null;
    }
  };

  const stopMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setHasCameraPermission(undefined);
  }

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      locationWatcher.current = navigator.geolocation.watchPosition(
        async (position) => {
          setHasGpsPermission(true);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ latitude: lat, longitude: lng });
          try{
            // send to firebase realtime database
            const { sendLocation } = await import('@/lib/firebase');
            await sendLocation('child-1', lat, lng, Date.now());
          }catch(e){
            console.error('Failed to send location to Firebase', e);
          }
        },
        (error) => {
          setHasGpsPermission(false);
          let errorMessage = 'Could not retrieve your location. Please grant permission.';
          
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = 'Location permission denied. Please enable in browser settings.';
            console.error('Geolocation permission denied');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = 'Location information is unavailable.';
            console.error('Position unavailable');
          } else if (error.code === error.TIMEOUT) {
            errorMessage = 'Location request timed out.';
            console.error('Location request timeout');
          } else {
            console.error('Error getting location:', error.message || error);
          }
          
          toast({
            variant: 'destructive',
            title: 'Location Error',
            description: errorMessage,
          });
        }
      );
    } else {
      setHasGpsPermission(false);
      toast({
        variant: 'destructive',
        title: 'Location Error',
        description: 'Geolocation is not supported by this browser.',
      });
    }
  };

  const stopLocationTracking = () => {
    if (locationWatcher.current !== null) {
      navigator.geolocation.clearWatch(locationWatcher.current);
      locationWatcher.current = null;
    }
  };


  const startAnalysis = () => {
    // Analysis requires a media stream (camera). Attempt to request media first.
    // If media is not available, skip analysis.
    (async () => {
      const s = await requestMedia();
      if (!s) return;
      // If you want to analyze, you can attach to a hidden video element or capture frames from the stream here.
      // For now we keep analysis minimal — call performAnalysis once and then schedule periodic checks
      performAnalysis();
      analysisInterval.current = setInterval(performAnalysis, 10000);
    })();
  };

  const stopAnalysis = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
  };

  const performAnalysis = async () => {
    // Basic analysis placeholder: capture a single frame if we have media, otherwise call with empty data.
    let videoDataUri = '';

    if (mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getVideoTracks();
      if (tracks && tracks.length) {
        const track = tracks[0];
        const imageCapture = ('ImageCapture' in window) ? (new (window as any).ImageCapture(track)) : null;
        if (imageCapture) {
          try {
            const bitmap = await imageCapture.grabFrame();
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(bitmap, 0, 0);
              videoDataUri = canvas.toDataURL('image/jpeg', 0.5);
            }
          } catch (e) {
            console.warn('frame capture failed', e);
          }
        }
      }
    }

    setPanicInfo(null); // Set to null to show "Analyzing..."
    const result = await runPanicDetection(videoDataUri);
    setPanicInfo(result);

    if (result.panicDetected) {
      toast({
        title: `Panic Detected: ${result.alertLevel.toUpperCase()}`,
        description: `Actions: ${result.actionsTaken.join(', ').replace(/_/g, ' ')}`,
        variant: result.alertLevel === 'high' ? 'destructive' : 'default',
        duration: 5000,
      });
    }
  };

  // New SOS behavior: direct 911 call (via tel:) and notify guardians
  const startCall = async () => {
    // Try to send local guardian notifications like before
    setIsLoading(true);
    try {
      // ensure location tracking runs when SOS is initiated
      startLocationTracking();
      toast({
        title: 'Notifying guardians',
        description: `Notifying ${guardianCount} guardian${guardianCount !== 1 ? 's' : ''}.`,
      });
      // Attempt to start analysis in background if media available
      startAnalysis();
    } finally {
      setIsLoading(false);
    }

    // Trigger a 911 call — on mobile this will open the phone dialer
    const confirmed = window.confirm('Call 911 now?');
    if (confirmed) {
      // Use tel: link to open the phone dialer
      window.location.href = 'tel:911';
      setIsCalling911(true);
    }
  };

  const endCall = () => {
    // End any local background tasks
    setIsCalling911(false);
    stopAnalysis();
    stopLocationTracking();
    stopMedia();
    setPanicInfo(null);
    setLocation(null);
    setHasGpsPermission(undefined);
    toast({ title: 'Call Ended' });
  };

  useEffect(() => {
    return () => {
      stopAnalysis();
      stopLocationTracking();
      stopMedia();
    };
  }, []);
  
  const LocationMap = () => (
    <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
      <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <h3 className="font-headline font-semibold">Live Location</h3>
        {hasGpsPermission === false && (
          <Alert variant="destructive" className="mt-2">
            <AlertTitle>GPS Access Denied</AlertTitle>
            <AlertDescription>
              Please enable location services to share your position.
            </AlertDescription>
          </Alert>
        )}
        {hasGpsPermission && location ? (
          <>
            <p className="text-sm text-muted-foreground font-mono">
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </p>
            <a
              href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
            >
              <Navigation size={12} />
              Open in Maps
            </a>
          </>
        ) : (
          hasGpsPermission !== false && <p className="text-sm text-muted-foreground">Tracking your position...</p>
        )}
      </div>
    </div>
  );

  const AISafetyAnalysis = () => (
    <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
      <ShieldAlert className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <h3 className="font-headline font-semibold">AI Safety Analysis</h3>
          {panicInfo ? (
          <div className="space-y-1 mt-1">
            {panicInfo.panicDetected ? (
              <>
                <AlertLevelBadge level={panicInfo.alertLevel} />
                  <p className="text-xs text-muted-foreground capitalize">
                    Actions: {panicInfo.actionsTaken.join(', ').replace(/_/g, ' ')}
                  </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No immediate threats detected.</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing surroundings...</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-200 dark:border-gray-800 bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-3 bg-secondary/50">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg font-bold">Guardian</CardTitle>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <span>{currentTime}</span>
          <Wifi size={18} />
          <BatteryFull size={18} />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {!isCalling911 ? (
          <div className="flex flex-col items-center justify-center gap-6 p-8 min-h-[450px]">
            <div className="text-center">
              <h2 className="font-headline text-2xl font-bold text-foreground">In Case of Emergency</h2>
              <p className="text-muted-foreground">Press the button to alert your guardians</p>
            </div>
              {guardianCount === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Guardians Added</AlertTitle>
                <AlertDescription>
                  <Link href="/guardians" className="underline">Add guardians</Link> to be notified in an emergency.
                </AlertDescription>
              </Alert>
            )}
            <div className="w-full">
              <div className="mt-4">
                {/* Child controls for foreground location sharing and quick calls */}
                {/* @ts-ignore */}
                <ChildControls />
              </div>
            </div>
            <Button
              onClick={startCall}
              disabled={isLoading}
              className="h-40 w-40 rounded-full bg-accent text-accent-foreground shadow-lg animate-pulse-strong flex flex-col gap-2 hover:bg-accent/90 disabled:animate-none"
              aria-label="Start Emergency Call"
            >
              {isLoading ? (
                <Loader2 className="h-16 w-16 animate-spin" />
              ) : (
                <>
                  <Phone size={48} />
                  <span className="text-2xl font-bold">SOS</span>
                </>
              )}
            </Button>
            <Button variant="secondary" asChild>
                <Link href="/guardians" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Manage Guardians ({guardianCount})
                </Link>
            </Button>
          </div>
        ) : (
          <div className="min-h-[450px] flex flex-col">
            <div className="p-4 space-y-4">
              <LocationMap />
              <AISafetyAnalysis />

              <div className="flex gap-3 mt-2">
                <Button onClick={startCall} variant="destructive" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" /> Call 911
                </Button>

                <Button asChild>
                  <Link href="/recordings" className="flex items-center gap-2">
                    <Video className="h-4 w-4" /> Recordings
                  </Link>
                </Button>

                <Button asChild variant="outline">
                  <Link href="/location" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Location
                  </Link>
                </Button>
              </div>

              <div className="flex gap-3 mt-4">
                {isRecording ? (
                  <Button onClick={async () => {
                    // stop recording
                    if (recorderRef.current) recorderRef.current.stop();
                    setIsRecording(false);
                    stopMedia();
                    toast({ title: 'Recording stopped and saved' });
                  }} variant="secondary" className="flex-1">
                    Stop Recording
                  </Button>
                ) : (
                  <Button onClick={async () => {
                    const stream = await requestMedia();
                    if (!stream) return;
                    try {
                      const MediaRecorderCtor = (window as any).MediaRecorder;
                      if (!MediaRecorderCtor) {
                        toast({ variant: 'destructive', title: 'MediaRecorder not supported in this browser' });
                        stopMedia();
                        return;
                      }
                      recordedChunksRef.current = [];
                      const recorder = new MediaRecorderCtor(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
                      recorder.ondataavailable = (ev: BlobEvent) => {
                        if (ev.data && ev.data.size) {
                          recordedChunksRef.current.push(ev.data);
                        }
                      };
                      recorder.onstop = async () => {
                        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                        const { saveRecording } = await import('@/lib/recordings');
                        try {
                          await saveRecording(blob);
                          toast({ title: 'Recording saved' });
                        } catch (e) {
                          console.error('saveRecording failed', e);
                          toast({ variant: 'destructive', title: 'Failed to save recording' });
                        }
                        stopMedia();
                      };
                      recorder.start();
                      recorderRef.current = recorder;
                      setIsRecording(true);
                      toast({ title: 'Recording started' });
                    } catch (e) {
                      console.error('Recording failed', e);
                      toast({ variant: 'destructive', title: 'Recording failed to start' });
                      stopMedia();
                    }
                  }} className="flex-1">
                    Start Recording
                  </Button>
                )}

                <Button variant="ghost" asChild>
                  <Link href="/guardians" className="flex-1">Manage Guardians</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
