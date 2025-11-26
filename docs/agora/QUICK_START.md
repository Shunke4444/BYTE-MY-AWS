# Quick Start Guide - Agora Workshop Template to Next.js

## TL;DR - 5 Minute Setup

### 1. Create Next.js App
```bash
npx create-next-app@latest agora-nextjs-app
cd agora-nextjs-app
```

### 2. Install Dependencies
```bash
npm install express
```

### 3. Copy API Routes

Create these files:

**`app/api/config/route.ts`**
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    AGORA_APPID: process.env.AGORA_APPID || null,
    AGORA_TOKEN: process.env.AGORA_TOKEN || null,
    GROQ_KEY: process.env.GROQ_KEY || null,
    TTS_MINIMAX_KEY: process.env.TTS_MINIMAX_KEY || null,
    TTS_MINIMAX_GROUPID: process.env.TTS_MINIMAX_GROUPID || null,
    AVATAR_AKOOL_KEY: process.env.AVATAR_AKOOL_KEY || null,
  });
}
```

**`app/api/convo-ai/start/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const appid = process.env.AGORA_APPID;
  const apiKey = process.env.AGORA_REST_KEY;
  const apiSecret = process.env.AGORA_REST_SECRET;

  if (!appid || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Missing Agora credentials' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/join`;
  const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

**`app/api/convo-ai/agents/[agentId]/leave/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const appid = process.env.AGORA_APPID;
  const apiKey = process.env.AGORA_REST_KEY;
  const apiSecret = process.env.AGORA_REST_SECRET;

  const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/agents/${agentId}/leave`;
  const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

### 4. Set Environment Variables

Create `.env.local`:
```env
AGORA_APPID=your_app_id
AGORA_REST_KEY=your_rest_key
AGORA_REST_SECRET=your_rest_secret
AGORA_TOKEN=your_token
GROQ_KEY=your_groq_key
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_group_id
AVATAR_AKOOL_KEY=your_akool_key
```

### 5. Create Video Call Page

**`app/video-call/page.tsx`**
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    AgoraRTC: any;
  }
}

export default function VideoCall() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const tracksRef = useRef<any>({ video: null, audio: null });

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setConfig);
  }, []);

  const createClient = () => {
    clientRef.current = window.AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  };

  const join = async () => {
    await clientRef.current.join(config.AGORA_APPID, '10000', config.AGORA_TOKEN, 10000);
  };

  const publish = async () => {
    const [audio, video] = await Promise.all([
      window.AgoraRTC.createMicrophoneAudioTrack(),
      window.AgoraRTC.createCameraVideoTrack(),
    ]);
    tracksRef.current = { audio, video };
    video.play(localVideoRef.current);
    await clientRef.current.publish([audio, video]);
  };

  const startAI = async () => {
    await fetch('/api/convo-ai/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '10000',
        properties: {
          channel: '10000',
          agent_rtc_uid: '10001',
          remote_rtc_uids: ['10000'],
          llm: { url: 'https://api.groq.com/openai/v1/chat/completions', api_key: config.GROQ_KEY, params: { model: 'llama-3.3-70b-versatile' } },
          tts: { vendor: 'minimax', params: { group_id: config.TTS_MINIMAX_GROUPID, key: config.TTS_MINIMAX_KEY } },
          avatar: { vendor: 'akool', params: { api_key: config.AVATAR_AKOOL_KEY, agora_uid: '10002', avatar_id: 'dvp_Sean_agora' } },
        },
      }),
    });
  };

  return (
    <>
      <Script src="https://download.agora.io/sdk/release/AgoraRTC_N.js" onLoad={() => setSdkLoaded(true)} />
      {sdkLoaded && config && (
        <div className="p-4">
          <div ref={localVideoRef} className="w-64 h-48 bg-gray-200 mb-4" />
          <div className="flex gap-2">
            <button onClick={createClient}>Create Client</button>
            <button onClick={join}>Join</button>
            <button onClick={publish}>Publish</button>
            <button onClick={startAI}>Start AI</button>
          </div>
        </div>
      )}
    </>
  );
}
```

### 6. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000/video-call`

---

## Key Differences from Template

| Template | Next.js |
|----------|---------|
| Express server (`scripts/server.js`) | Next.js API Routes (`app/api/`) |
| Static HTML files | React components (`app/*/page.tsx`) |
| CDN script tags | Next.js `Script` component |
| Global `window.AgoraRTC` | TypeScript declarations |
| jQuery/Bootstrap | React hooks + Tailwind/CSS |

---

## Essential Files to Port

1. ✅ **API Routes** → `app/api/` (already done above)
2. ⚠️ **Client Logic** → `app/video-call/page.tsx` (simplified above)
3. ⚠️ **Utilities** → `lib/agora.ts` (from `src/common/utils.js`)
4. ⚠️ **Constants** → `lib/constants.ts` (from `src/common/constant.js`)
5. ⚠️ **Styles** → `app/globals.css` (from `src/common/common.css`)

---

## Next Steps

1. Read the full [NEXTJS_INTEGRATION_GUIDE.md](./NEXTJS_INTEGRATION_GUIDE.md)
2. Port the complete UI from `src/example/basic/basicVideoCall/index.html`
3. Add proper TypeScript types
4. Implement error handling
5. Add cleanup logic

---

## Common Issues

**SDK not loading?** → Wait for `onLoad` callback before using `window.AgoraRTC`

**CORS errors?** → Check API routes are in `app/api/` directory

**Token errors?** → Verify environment variables are set correctly

**Video not showing?** → Check browser permissions and ref attachments

