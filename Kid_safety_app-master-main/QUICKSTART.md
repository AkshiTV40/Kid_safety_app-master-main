# Quick Start Guide - Guardian Keychain Portal

## 📋 Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git (optional)

## 🚀 Getting Started

### Step 1: Wait for npm install to complete
The dependencies are currently installing. You'll see:
```
⠇ Packages installing...
```

Once complete, you'll see:
```
added X packages in Xs
```

### Step 2: Start Local Development Server

After npm install finishes, run:
```bash
npm run dev
```

This starts the development server at: **http://localhost:9002**

### Step 3: View Your Portal

Open your browser and navigate to:
- **Portal (Main Page)**: http://localhost:9002/portal
- **Main App**: http://localhost:9002
- **Keychain App**: http://localhost:9002/keychain

---

## 📍 Portal Features

Your portal includes:
✅ Responsive navigation bar
✅ Hero section with call-to-action
✅ 6 feature cards (Location Sharing, AI Detection, Encryption, etc.)
✅ "How It Works" step-by-step guide
✅ Pricing section with 3 tiers
✅ Call-to-action section
✅ Footer with links
✅ Mobile responsive design
✅ HTTPS ready with security headers

---

## 🔒 HTTPS & Deployment

### Local Testing with HTTPS
```bash
# Install self-signed certificate tools
npm install -g mkcert

# Generate local certificate
mkcert localhost

# Move certificates to ssl folder
mkdir ssl
mv localhost-key.pem ssl/server.key
mv localhost.pem ssl/server.crt

# Start with HTTPS
npm run start:https
```

Then visit: **https://localhost:3000**

### Production Deployment (Choose One)

#### Option 1: Firebase (Recommended)
```bash
firebase login
firebase deploy
```
Your app: `https://[project-id].web.app/portal`

#### Option 2: Vercel (Easiest)
1. Push to GitHub
2. Go to https://vercel.com
3. Import your repo
4. Auto-deploy with HTTPS

#### Option 3: Docker
```bash
docker-compose up
```
Access at: `https://localhost:443/portal`

---

## 📦 Available Scripts

- `npm run dev` - Start development server (port 9002)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript

---

## 🛠 File Structure

```
src/
├── app/
│   ├── portal/
│   │   └── page.tsx          ← Your main portal page
│   ├── keychain/
│   │   └── page.tsx          ← App page
│   ├── guardians/
│   │   └── page.tsx          ← Guardians page
│   ├── layout.tsx            ← Root layout
│   └── globals.css           ← Global styles
├── components/
│   ├── ui/                   ← Shadcn UI components
│   └── logo.tsx              ← Logo component
├── hooks/                    ← Custom React hooks
└── lib/                      ← Utilities
```

---

## ✨ Portal Components

### Navigation
- Sticky header with logo and navigation links
- Links to Features, How It Works, Pricing sections
- "Get Started" button linking to /keychain

### Sections
1. **Hero** - Main headline with CTA buttons
2. **Features** - 6 feature cards with icons
3. **How It Works** - 4-step process guide
4. **Pricing** - Basic, Pro, Enterprise tiers
5. **CTA** - "Ready to Stay Safe?" call-to-action
6. **Footer** - Company info and links

---

## 🎨 Customization

### Update Portal Text
Edit [src/app/portal/page.tsx](src/app/portal/page.tsx)

### Change Colors
Edit [tailwind.config.ts](tailwind.config.ts)

### Add New Features
1. Add new feature card in Features section
2. Add icon import from lucide-react
3. Update the grid layout if needed

---

## 🧪 Testing

### Local Testing
```bash
npm run dev
# Visit http://localhost:9002/portal
```

### Build Testing
```bash
npm run build
npm run start
# Visit http://localhost:3000/portal
```

### Mobile Testing
- Use Chrome DevTools (F12) → Toggle Device Toolbar
- Or visit from mobile device on your local network

---

## 🐛 Troubleshooting

### npm install fails
```bash
# Clean and retry
rm -r node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
```

### Port 9002 already in use
```bash
npm run dev -- -p 3000
```

### Build errors
```bash
npm run typecheck
npm run lint
```

---

## 📚 Technology Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS
- **Components**: Radix UI (shadcn/ui)
- **Icons**: Lucide React
- **PWA**: next-pwa
- **Forms**: React Hook Form
- **Database**: Firebase
- **AI**: Google Genkit

---

## 🚀 Next Steps

1. ✅ Wait for npm install to finish
2. ✅ Run `npm run dev`
3. ✅ Visit http://localhost:9002/portal
4. ✅ Test all navigation and links
5. ✅ Deploy to Firebase/Vercel/Azure

---

**Need help?** Check the [DEPLOYMENT.md](DEPLOYMENT.md) file for detailed deployment instructions.
