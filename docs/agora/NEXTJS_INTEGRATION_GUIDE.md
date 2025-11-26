# Next.js Integration Guide for Agora Workshop Template

## Table of Contents
1. [Overview](#overview)
2. [Project Architecture](#project-architecture)
3. [Prerequisites](#prerequisites)
4. [Integration Steps](#integration-steps)
5. [Code Examples](#code-examples)
6. [API Routes Setup](#api-routes-setup)
7. [Environment Variables](#environment-variables)
8. [Component Structure](#component-structure)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide explains how to integrate the Agora Workshop Template into a Next.js application. The template provides:

- **Agora RTC Web SDK 4.x** for real-time video/audio communication
- **Agora Conversational AI** integration with:
  - LLM (Groq, OpenAI, AWS Bedrock)
  - TTS (Minimax)
  - Avatar (Akool)
- Express server endpoints for secure API key management
- Modern UI for video calling with AI agent

---

## Project Architecture

### Current Template Structure
```
Agora-Workshop-Template/
├── scripts/
│   ├── server.js          # Express server with API endpoints
│   └── pure.js            # SSO cleanup utility
├── src/
│   ├── assets/            # Static assets (logos, CSS, JS)
│   ├── common/            # Shared utilities and constants
│   ├── example/
│   │   └── basic/
│   │       └── basicVideoCall/  # Main video call example
│   ├── i18n/              # Internationalization
│   ├── index.html         # Setup page
│   └── index.js           # Main entry point
├── package.json
└── README.md
```

### Key Components

1. **Server Endpoints** (`scripts/server.js`):
   - `GET /config` - Returns safe client-side configuration
   - `POST /api/convo-ai/start` - Starts Agora Conversational AI agent
   - `POST /api/convo-ai/agents/:agentId/leave` - Stops the AI agent

2. **Client-Side Logic** (`src/example/basic/basicVideoCall/index.js`):
   - Agora RTC client creation and channel management
   - Local/remote track handling
   - Conversational AI agent integration

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- Next.js 13+ (App Router recommended)
- Agora account with:
  - App ID
  - RESTful API Key and Secret
  - Conversational AI Engine enabled
- Optional service accounts:
  - Groq API key (for LLM)
  - Minimax API key and Group ID (for TTS)
  - Akool API key (for Avatar)

---

## Integration Steps

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest agora-nextjs-app
cd agora-nextjs-app
```

### Step 2: Install Dependencies

```bash
npm install express
# or
yarn add express
```

**Note**: The Agora RTC SDK is loaded via CDN in the template. For Next.js, you can:
- Continue using CDN (via `next/script`)
- Install via npm: `npm install agora-rtc-sdk-ng`

### Step 3: Set Up Environment Variables

Create a `.env.local` file in your Next.js project root:

```env
# Agora Configuration
AGORA_APPID=your_agora_appid
AGORA_TOKEN=your_agora_token
AGORA_REST_KEY=your_agora_restful_key
AGORA_REST_SECRET=your_agora_restful_secret

# LLM Configuration (Optional)
GROQ_KEY=your_groq_key
OPENAI_KEY=your_openai_key
LLM_AWS_BEDROCK_KEY=your_aws_bedrock_key
LLM_AWS_BEDROCK_ACCESS_KEY=your_aws_access_key
LLM_AWS_BEDROCK_SECRET_KEY=your_aws_secret_key

# TTS Configuration (Optional)
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_minimax_groupid

# Avatar Configuration (Optional)
AVATAR_AKOOL_KEY=your_akool_key
```

### Step 4: Create API Routes

Create the following API routes in your Next.js app:

---

## API Routes Setup

### 4.1 Config Endpoint

Create `app/api/config/route.ts` (or `pages/api/config.ts` for Pages Router):

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    AGORA_APPID: process.env.AGORA_APPID || null,
    AGORA_TOKEN: process.env.AGORA_TOKEN || null,
    LLM_AWS_BEDROCK_KEY: process.env.LLM_AWS_BEDROCK_KEY || null,
    LLM_AWS_BEDROCK_ACCESS_KEY: process.env.LLM_AWS_BEDROCK_ACCESS_KEY || null,
    LLM_AWS_BEDROCK_SECRET_KEY: process.env.LLM_AWS_BEDROCK_SECRET_KEY || null,
    OPENAI_KEY: process.env.OPENAI_KEY || null,
    GROQ_KEY: process.env.GROQ_KEY || null,
    TTS_MINIMAX_KEY: process.env.TTS_MINIMAX_KEY || null,
    TTS_MINIMAX_GROUPID: process.env.TTS_MINIMAX_GROUPID || null,
    AVATAR_AKOOL_KEY: process.env.AVATAR_AKOOL_KEY || null,
  });
}
```

### 4.2 Convo AI Start Endpoint

Create `app/api/convo-ai/start/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;

    if (!appid || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing Agora credentials' },
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
      body: JSON.stringify(body || {}),
    });

    const data = await response.text();
    const status = response.status;

    try {
      return NextResponse.json(JSON.parse(data), { status });
    } catch (e) {
      return new NextResponse(data, { status });
    }
  } catch (err) {
    console.error('Proxy /api/convo-ai/start error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
```

### 4.3 Convo AI Leave Endpoint

Create `app/api/convo-ai/agents/[agentId]/leave/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    const appid = process.env.AGORA_APPID;
    const apiKey = process.env.AGORA_REST_KEY;
    const apiSecret = process.env.AGORA_REST_SECRET;

    if (!appid || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Server misconfigured: missing Agora credentials' },
        { status: 500 }
      );
    }

    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appid}/agents/${agentId}/leave`;
    const basic = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
    const status = response.status;

    try {
      return NextResponse.json(JSON.parse(data), { status });
    } catch (e) {
      return new NextResponse(data, { status });
    }
  } catch (err) {
    console.error('Proxy /api/convo-ai/leave error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
```

---

## Code Examples

### 5.1 Client Component for Video Call

Create `app/video-call/page.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    AgoraRTC: any;
  }
}

export default function VideoCallPage() {
  const [agoraSDKLoaded, setAgoraSDKLoaded] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const localTracksRef = useRef<{ videoTrack: any; audioTrack: any }>({
    videoTrack: null,
    audioTrack: null,
  });

  // Load Agora SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AgoraRTC) {
      setAgoraSDKLoaded(true);
    }
  }, []);

  // Load config from API
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(console.error);
  }, []);

  const createClient = () => {
    if (!window.AgoraRTC) return;
    clientRef.current = window.AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    });
  };

  const joinChannel = async () => {
    if (!clientRef.current || !config) return;

    const channel = '10000';
    const uid = 10000;
    const token = config.AGORA_TOKEN || null;

    await clientRef.current.join(
      config.AGORA_APPID,
      channel,
      token,
      uid
    );
  };

  const createTracksAndPublish = async () => {
    if (!clientRef.current || !window.AgoraRTC) return;

    const tracks = await Promise.all([
      window.AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
      }),
      window.AgoraRTC.createCameraVideoTrack(),
    ]);

    localTracksRef.current.audioTrack = tracks[0];
    localTracksRef.current.videoTrack = tracks[1];

    // Play local video
    localTracksRef.current.videoTrack.play(localVideoRef.current, {
      mirror: true,
    });

    // Publish tracks
    await clientRef.current.publish([
      localTracksRef.current.audioTrack,
      localTracksRef.current.videoTrack,
    ]);
  };

  const startConvoAI = async () => {
    if (!config) return;

    const requestData = {
      name: '10000',
      properties: {
        channel: '10000',
        agent_rtc_uid: '10001',
        remote_rtc_uids: ['10000'],
        idle_timeout: 30,
        advanced_features: {
          enable_aivad: true,
          enable_mllm: false,
          enable_rtm: false,
        },
        asr: {
          language: 'en-US',
        },
        llm: {
          url: 'https://api.groq.com/openai/v1/chat/completions',
          api_key: config.GROQ_KEY,
          system_messages: [
            {
              role: 'system',
              content:
                'You are a helpful chat bot. Keep answers short and concise.',
            },
          ],
          greeting_message: 'Hello, how are you?',
          failure_message: 'Sorry, technical issues prevent me from responding.',
          params: {
            model: 'llama-3.3-70b-versatile',
          },
        },
        tts: {
          vendor: 'minimax',
          params: {
            url: 'wss://api.minimax.io/ws/v1/t2a_v2',
            group_id: config.TTS_MINIMAX_GROUPID,
            key: config.TTS_MINIMAX_KEY,
            model: 'speech-2.6-turbo',
            voice_setting: {
              voice_id: 'English_Lively_Male_11',
              speed: 1,
              vol: 1,
              pitch: 0,
              emotion: 'happy',
            },
            audio_setting: {
              sample_rate: 16000,
            },
          },
          skip_patterns: [3, 4],
        },
        avatar: {
          vendor: 'akool',
          enable: true,
          params: {
            api_key: config.AVATAR_AKOOL_KEY,
            agora_uid: '10002',
            avatar_id: 'dvp_Sean_agora',
          },
        },
      },
    };

    const response = await fetch('/api/convo-ai/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error('Failed to start Convo AI');
    }

    const data = await response.json();
    console.log('Convo AI started:', data);
  };

  if (!agoraSDKLoaded || !config) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Script
        src="https://download.agora.io/sdk/release/AgoraRTC_N.js"
        onLoad={() => setAgoraSDKLoaded(true)}
      />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Agora Video Call</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Local Video</h2>
            <div ref={localVideoRef} className="w-full h-64 bg-gray-200" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Remote Video</h2>
            <div ref={remoteVideoRef} className="w-full h-64 bg-gray-200" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={createClient}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Create Client
          </button>
          <button
            onClick={joinChannel}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Join Channel
          </button>
          <button
            onClick={createTracksAndPublish}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Create Tracks & Publish
          </button>
          <button
            onClick={startConvoAI}
            className="px-4 py-2 bg-orange-500 text-white rounded"
          >
            Start Convo AI
          </button>
        </div>
      </div>
    </>
  );
}
```

### 5.2 Custom Hook for Agora RTC

Create `hooks/useAgoraRTC.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';

interface UseAgoraRTCOptions {
  appId: string;
  channel: string;
  token?: string;
  uid?: number | string;
}

export function useAgoraRTC(options: UseAgoraRTCOptions) {
  const [client, setClient] = useState<any>(null);
  const [localTracks, setLocalTracks] = useState<{
    videoTrack: any;
    audioTrack: any;
  }>({
    videoTrack: null,
    audioTrack: null,
  });
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.AgoraRTC) return;

    const agoraClient = window.AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'vp8',
    });

    // Event handlers
    agoraClient.on('user-published', handleUserPublished);
    agoraClient.on('user-unpublished', handleUserUnpublished);
    agoraClient.on('user-left', handleUserLeft);

    setClient(agoraClient);

    return () => {
      agoraClient.removeAllListeners();
      agoraClient.leave();
    };
  }, []);

  const handleUserPublished = async (user: any, mediaType: string) => {
    await client.subscribe(user, mediaType);
    if (mediaType === 'video') {
      setRemoteUsers((prev) => [...prev, user]);
    }
  };

  const handleUserUnpublished = (user: any, mediaType: string) => {
    if (mediaType === 'video') {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    }
  };

  const handleUserLeft = (user: any) => {
    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
  };

  const join = async () => {
    if (!client) return;
    await client.join(options.appId, options.channel, options.token, options.uid);
    setIsJoined(true);
  };

  const leave = async () => {
    if (!client) return;
    await client.leave();
    setIsJoined(false);
  };

  const createTracks = async () => {
    if (!window.AgoraRTC) return;

    const tracks = await Promise.all([
      window.AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
      }),
      window.AgoraRTC.createCameraVideoTrack(),
    ]);

    setLocalTracks({
      audioTrack: tracks[0],
      videoTrack: tracks[1],
    });

    return tracks;
  };

  const publish = async () => {
    if (!client || !localTracks.videoTrack || !localTracks.audioTrack) return;
    await client.publish([localTracks.audioTrack, localTracks.videoTrack]);
  };

  const unpublish = async () => {
    if (!client) return;
    await client.unpublish([localTracks.audioTrack, localTracks.videoTrack]);
  };

  return {
    client,
    localTracks,
    remoteUsers,
    isJoined,
    join,
    leave,
    createTracks,
    publish,
    unpublish,
  };
}
```

---

## Component Structure

### Recommended Next.js App Structure

```
app/
├── api/
│   ├── config/
│   │   └── route.ts
│   └── convo-ai/
│       ├── start/
│       │   └── route.ts
│       └── agents/
│           └── [agentId]/
│               └── leave/
│                   └── route.ts
├── video-call/
│   └── page.tsx
├── layout.tsx
└── page.tsx

hooks/
└── useAgoraRTC.ts

components/
├── VideoCall/
│   ├── index.tsx
│   ├── LocalVideo.tsx
│   ├── RemoteVideo.tsx
│   └── Controls.tsx
└── ConvoAI/
    └── AgentControls.tsx

lib/
└── agora.ts          # Agora utility functions
```

---

## Environment Variables

### Required Variables

```env
AGORA_APPID=your_app_id
AGORA_REST_KEY=your_rest_key
AGORA_REST_SECRET=your_rest_secret
```

### Optional Variables

```env
AGORA_TOKEN=your_token
GROQ_KEY=your_groq_key
OPENAI_KEY=your_openai_key
TTS_MINIMAX_KEY=your_minimax_key
TTS_MINIMAX_GROUPID=your_group_id
AVATAR_AKOOL_KEY=your_akool_key
```

**Security Note**: Never expose `AGORA_REST_KEY` and `AGORA_REST_SECRET` to the client. Always use them in API routes only.

---

## Best Practices

### 1. SDK Loading

**Option A: CDN (Current Template Approach)**
```tsx
<Script
  src="https://download.agora.io/sdk/release/AgoraRTC_N.js"
  strategy="beforeInteractive"
/>
```

**Option B: NPM Package**
```bash
npm install agora-rtc-sdk-ng
```
```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';
```

### 2. Error Handling

Always wrap Agora operations in try-catch blocks:

```typescript
try {
  await client.join(appId, channel, token, uid);
} catch (error) {
  console.error('Join channel failed:', error);
  // Handle error appropriately
}
```

### 3. Cleanup

Always clean up tracks and leave channels on component unmount:

```typescript
useEffect(() => {
  return () => {
    localTracks.videoTrack?.stop();
    localTracks.videoTrack?.close();
    localTracks.audioTrack?.stop();
    localTracks.audioTrack?.close();
    client?.leave();
  };
}, []);
```

### 4. TypeScript Types

Install Agora types:

```bash
npm install --save-dev @types/agora-rtc-sdk-ng
```

Or create custom types:

```typescript
// types/agora.d.ts
declare global {
  interface Window {
    AgoraRTC: {
      createClient: (config: any) => any;
      createMicrophoneAudioTrack: (config?: any) => Promise<any>;
      createCameraVideoTrack: (config?: any) => Promise<any>;
      getMicrophones: () => Promise<any[]>;
      getCameras: () => Promise<any[]>;
      VERSION: string;
      onAutoplayFailed: (callback: () => void) => void;
    };
  }
}
```

### 5. State Management

Consider using React Context or Zustand for managing Agora client state across components:

```typescript
// contexts/AgoraContext.tsx
import { createContext, useContext } from 'react';

const AgoraContext = createContext<any>(null);

export function AgoraProvider({ children }: { children: React.ReactNode }) {
  // Agora client and state management
  return (
    <AgoraContext.Provider value={/* your value */}>
      {children}
    </AgoraContext.Provider>
  );
}

export const useAgora = () => useContext(AgoraContext);
```

---

## Troubleshooting

### Issue: SDK Not Loading

**Solution**: Ensure the Script component is loaded before using AgoraRTC:

```tsx
const [sdkLoaded, setSdkLoaded] = useState(false);

<Script
  src="https://download.agora.io/sdk/release/AgoraRTC_N.js"
  onLoad={() => setSdkLoaded(true)}
/>

{sdkLoaded && <YourComponent />}
```

### Issue: CORS Errors

**Solution**: Ensure API routes are properly configured and environment variables are set.

### Issue: Token Errors

**Solution**: 
- Verify token generation parameters match your configuration
- Check token expiration
- Ensure app certificate is properly configured

### Issue: Video Not Displaying

**Solution**:
- Check browser permissions for camera/microphone
- Verify video element refs are properly attached
- Ensure tracks are created and published before playing

### Issue: Convo AI Not Starting

**Solution**:
- Verify all required environment variables are set
- Check API key permissions in Agora Console
- Ensure Conversational AI Engine is enabled in your Agora project
- Verify LLM/TTS/Avatar service credentials are correct

---

## Migration Checklist

- [ ] Create Next.js project
- [ ] Install dependencies
- [ ] Set up environment variables
- [ ] Create API routes (`/api/config`, `/api/convo-ai/start`, `/api/convo-ai/agents/[agentId]/leave`)
- [ ] Copy and adapt client-side code from `src/example/basic/basicVideoCall/`
- [ ] Set up Agora SDK loading (CDN or NPM)
- [ ] Create React components for video call UI
- [ ] Implement error handling
- [ ] Add cleanup logic
- [ ] Test video/audio functionality
- [ ] Test Convo AI integration
- [ ] Deploy and configure production environment variables

---

## Additional Resources

- [Agora RTC Web SDK Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web)
- [Agora Conversational AI Documentation](https://docs.agora.io/en/conversational-ai/get-started/quickstart)
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)

---

## Support

For issues specific to:
- **Agora SDK**: Check [Agora Documentation](https://docs.agora.io/)
- **Next.js Integration**: Refer to this guide and Next.js documentation
- **Template Issues**: Refer to the original template README.md

---

**Last Updated**: Based on Agora Workshop Template v1.0

