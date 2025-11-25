# Agora RTM Quick Start

## Installation

```bash
npm install agora-rtm-sdk
```

## Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
```

Get your App ID from [Agora Console](https://console.agora.io/)

## Minimal Example

### 1. Create Service (`services/agora/agoraRTMService.ts`)

```typescript
'use client'

import AgoraRTM from 'agora-rtm-sdk'

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''

export class AgoraRTMService {
  private client: AgoraRTM.RtmClient | null = null
  private channel: AgoraRTM.RtmChannel | null = null

  async login(uid: string) {
    this.client = AgoraRTM.createInstance(appId)
    await this.client.login({ uid })
  }

  async joinChannel(channelName: string) {
    if (!this.client) throw new Error('Not logged in')
    this.channel = this.client.createChannel(channelName)
    await this.channel.join()
  }

  async sendMessage(text: string) {
    if (!this.channel) throw new Error('Not in channel')
    await this.channel.sendMessage({ text })
  }

  onMessage(callback: (message: any, uid: string) => void) {
    if (this.channel) {
      this.channel.on('ChannelMessage', callback)
    }
  }

  async cleanup() {
    if (this.channel) await this.channel.leave()
    if (this.client) await this.client.logout()
  }
}

export const agoraRTMService = new AgoraRTMService()
```

### 2. Create Component (`components/chat/SimpleChat.tsx`)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { agoraRTMService } from '@/services/agora/agoraRTMService'

export function SimpleChat() {
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      const uid = `user_${Math.random().toString(36).substr(2, 9)}`
      await agoraRTMService.login(uid)
      await agoraRTMService.joinChannel('test-channel')
      
      agoraRTMService.onMessage((message, uid) => {
        setMessages(prev => [...prev, `${uid}: ${message.text}`])
      })
      
      setIsReady(true)
    }
    
    init()
    
    return () => {
      agoraRTMService.cleanup()
    }
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return
    await agoraRTMService.sendMessage(input)
    setInput('')
  }

  if (!isReady) return <div>Connecting...</div>

  return (
    <div className="p-4">
      <div className="border rounded p-4 mb-4 h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 border rounded p-2"
        />
        <button onClick={sendMessage} className="px-4 py-2 bg-blue-500 text-white rounded">
          Send
        </button>
      </div>
    </div>
  )
}
```

### 3. Create Page (`app/chat/page.tsx`)

```typescript
import dynamic from 'next/dynamic'

const SimpleChat = dynamic(() => import('@/components/chat/SimpleChat'), {
  ssr: false,
})

export default function ChatPage() {
  return <SimpleChat />
}
```

## Test It

1. Run `npm run dev`
2. Open `http://localhost:3000/chat` in multiple browser tabs
3. Send messages and see them appear in all tabs!

## Key Points

- ✅ Use `'use client'` directive
- ✅ Use `dynamic` import with `ssr: false`
- ✅ Always cleanup on unmount
- ✅ Handle errors properly

For full implementation, see [AGORA_RTM_GUIDE.md](./AGORA_RTM_GUIDE.md)

