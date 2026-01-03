export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage(){
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-4">This is a template privacy policy. This application collects location data while the app is open to provide live location sharing to authorized Guardian/Parent accounts. Location data is stored securely and only used to provide features within the app, and will be retained until deleted by the user.</p>
      <h2 className="mt-4 font-semibold">Consent</h2>
      <p className="mt-2">Users will be asked to consent to location collection and notifications at first use. Parents must also be informed of how data is shared and how to remove access.</p>
      <h2 className="mt-4 font-semibold">Third parties</h2>
      <p className="mt-2">This app may use Firebase (Google) for realtime database and FCM for messaging. Please review Google privacy practices if you enable these services.</p>
    </main>
  );
}
