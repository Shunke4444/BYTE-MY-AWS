# Agora Integration Guide for Next.js

## Overview

This guide covers integrating **Agora AI**, **Agora RTC SDK**, and **Agora RTM SDK** into your Next.js project for building NextGen Intelligent Conversational Agents.

## BIG REQUIREMENTS

1. **Agora AI** - PRIMARY conversational AI platform (MUST use)
2. **Agora SDK** - For real-time communication (RTC, RTM, Live Streaming) (MUST use)
3. **AWS Services** - For backend infrastructure, storage, and compute (MUST use)

## Prerequisites

1. **Agora Account Setup:**
   - Sign up at [Agora Console](https://console.agora.io/)
   - Create a new project
   - Get your **App ID** and **App Certificate**
   - Store credentials securely (use AWS Secrets Manager in production)

2. **Agora AI Setup:**
   - Enable Agora AI in your Agora Console
   - Get API keys for Agora AI service
   - Configure AI models and settings

## Installation

### 1. Install Agora SDK Packages

```bash
# Agora RTC SDK (Real-Time Communication - Video/Audio)
npm install agora-rtc-sdk-ng

# Agora RTM SDK (Real-Time Messaging)
npm install agora-rtm-sdk

# Agora React Hooks (Optional but recommended)
npm install agora-rtc-react

# TypeScript types (if using TypeScript)
npm install --save-dev @types/node
```

### 2. Install AWS SDK (for backend integration)

```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/client-s3 @aws-sdk/client-cognito-identity-provider
```

## Project Structure

```
frontend/
  app/
    api/
      agora/
        token/
          route.ts          # Token generation endpoint
        rtc/
          route.ts          # RTC configuration
        rtm/
          route.ts          # RTM configuration
    chat/
      page.tsx              # Chat interface
    video/
      page.tsx              # Video call interface
  components/
    agents/
      AgentChat.tsx         # Chat component with Agora AI
      AgentVideoCall.tsx    # Video call component
      AgentLiveStream.tsx   # Live streaming component
    realtime/
      AgoraRTC.tsx          # RTC wrapper component
      AgoraRTM.tsx          # RTM wrapper component
  hooks/
    useAgoraRTC.ts          # RTC hook
    useAgoraRTM.ts          # RTM hook
    useAgoraAI.ts           # Agora AI hook
    useAgentConversation.ts # Conversation management hook
  services/
    agora/
      agoraAIService.ts     # Agora AI service (PRIMARY)
      agoraRTCService.ts    # RTC service
      agoraRTMService.ts    # RTM service
    aws/
      dynamoService.ts      # DynamoDB for conversation storage
      cognitoService.ts     # Cognito for authentication
  lib/
    agora/
      agoraAIConfig.ts     # Agora AI configuration
      agoraRTCConfig.ts    # RTC configuration
      agoraRTMConfig.ts    # RTM configuration
      tokenGenerator.ts    # Token generation utility
```

## Configuration

### 1. Environment Variables

Create `.env.local`:

```env
# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate

# Agora AI Configuration
AGORA_AI_API_KEY=your_ai_api_key
AGORA_AI_API_SECRET=your_ai_api_secret
AGORA_AI_BASE_URL=https://api.agora.io/v1/ai

# AWS Configuration
AWS_REGION=us-east-1
AWS_DYNAMODB_TABLE=conversations
AWS_S3_BUCKET=agent-assets
AWS_COGNITO_USER_POOL_ID=your_user_pool_id
```

### 2. Agora Configuration Files

**`lib/agora/agoraRTCConfig.ts`:**

```typescript
export const agoraRTCConfig = {
	appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
	mode: 'rtc' as const,
	codec: 'vp8' as const,
}

export const rtcClientOptions = {
	mode: 'rtc' as const,
	codec: 'vp8' as const,
}
```

**`lib/agora/agoraRTMConfig.ts`:**

```typescript
export const agoraRTMConfig = {
	appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
}
```

**`lib/agora/agoraAIConfig.ts`:**

```typescript
export const agoraAIConfig = {
	apiKey: process.env.AGORA_AI_API_KEY || '',
	apiSecret: process.env.AGORA_AI_API_SECRET || '',
	baseUrl: process.env.AGORA_AI_BASE_URL || 'https://api.agora.io/v1/ai',
}
```

## Implementation

### 1. Server-Side Token Generation (API Route)

**`app/api/agora/token/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'

export async function POST(request: NextRequest) {
	try {
		const { channelName, uid } = await request.json()

		const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
		const appCertificate = process.env.AGORA_APP_CERTIFICATE

		if (!appId || !appCertificate) {
			return NextResponse.json(
				{ error: 'Agora credentials not configured' },
				{ status: 500 }
			)
		}

		const role = RtcRole.PUBLISHER
		const expirationTimeInSeconds = 3600 // 1 hour
		const currentTimestamp = Math.floor(Date.now() / 1000)
		const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

		const token = RtcTokenBuilder.buildTokenWithUid(
			appId,
			appCertificate,
			channelName,
			uid || 0,
			role,
			privilegeExpiredTs
		)

		return NextResponse.json({ token, appId })
	} catch (error) {
		console.error('Token generation error:', error)
		return NextResponse.json(
			{ error: 'Failed to generate token' },
			{ status: 500 }
		)
	}
}
```

**Note:** Install token builder: `npm install agora-access-token`

### 2. Agora AI Service (PRIMARY)

**`services/agora/agoraAIService.ts`:**

```typescript
import { agoraAIConfig } from '@/lib/agora/agoraAIConfig'

export interface AgoraAIRequest {
	message: string
	conversationId?: string
	context?: Record<string, any>
}

export interface AgoraAIResponse {
	response: string
	conversationId: string
	intent?: string
	entities?: Array<{ type: string; value: string }>
}

export class AgoraAIService {
	private baseUrl: string
	private apiKey: string
	private apiSecret: string

	constructor() {
		this.baseUrl = agoraAIConfig.baseUrl
		this.apiKey = agoraAIConfig.apiKey
		this.apiSecret = agoraAIConfig.apiSecret
	}

	private async getAuthToken(): Promise<string> {
		// Generate authentication token for Agora AI API
		// This should be done server-side for security
		const response = await fetch('/api/agora/ai/auth', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		})

		const data = await response.json()
		return data.token
	}

	async sendMessage(request: AgoraAIRequest): Promise<AgoraAIResponse> {
		try {
			const token = await this.getAuthToken()

			const response = await fetch(`${this.baseUrl}/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'X-API-Key': this.apiKey,
				},
				body: JSON.stringify({
					message: request.message,
					conversation_id: request.conversationId,
					context: request.context,
				}),
			})

			if (!response.ok) {
				throw new Error(`Agora AI API error: ${response.statusText}`)
			}

			const data = await response.json()
			return {
				response: data.response,
				conversationId: data.conversation_id,
				intent: data.intent,
				entities: data.entities,
			}
		} catch (error) {
			console.error('Agora AI service error:', error)
			throw error
		}
	}

	async recognizeIntent(message: string): Promise<{
		intent: string
		confidence: number
		entities: Array<{ type: string; value: string }>
	}> {
		try {
			const token = await this.getAuthToken()

			const response = await fetch(`${this.baseUrl}/intent`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'X-API-Key': this.apiKey,
				},
				body: JSON.stringify({ message }),
			})

			if (!response.ok) {
				throw new Error(`Agora AI API error: ${response.statusText}`)
			}

			return await response.json()
		} catch (error) {
			console.error('Intent recognition error:', error)
			throw error
		}
	}
}

export const agoraAIService = new AgoraAIService()
```

### 3. Agora RTC Service

**`services/agora/agoraRTCService.ts`:**

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng'
import { agoraRTCConfig } from '@/lib/agora/agoraRTCConfig'

export class AgoraRTCService {
	private client: AgoraRTC.IAgoraRTCClient | null = null

	async createClient() {
		if (this.client) {
			return this.client
		}

		this.client = AgoraRTC.createClient({
			mode: 'rtc',
			codec: 'vp8',
		})

		return this.client
	}

	async initialize(appId: string) {
		const client = await this.createClient()
		await client.init(appId)
		return client
	}

	async joinChannel(
		token: string,
		channelName: string,
		uid: string | number | null = null
	) {
		if (!this.client) {
			throw new Error('Client not initialized')
		}

		await this.client.join(
			agoraRTCConfig.appId,
			channelName,
			token,
			uid
		)
	}

	async leaveChannel() {
		if (this.client) {
			await this.client.leave()
		}
	}

	async createLocalTracks() {
		return await AgoraRTC.createMicrophoneAndCameraTracks()
	}

	async publishTracks(tracks: AgoraRTC.ILocalAudioTrack[]) {
		if (!this.client) {
			throw new Error('Client not initialized')
		}
		await this.client.publish(tracks)
	}

	async unpublishTracks(tracks: AgoraRTC.ILocalAudioTrack[]) {
		if (!this.client) {
			throw new Error('Client not initialized')
		}
		await this.client.unpublish(tracks)
	}

	cleanup() {
		if (this.client) {
			this.client.leave()
			this.client = null
		}
	}
}

export const agoraRTCService = new AgoraRTCService()
```

### 4. Agora RTM Service

**`services/agora/agoraRTMService.ts`:**

```typescript
import AgoraRTM from 'agora-rtm-sdk'
import { agoraRTMConfig } from '@/lib/agora/agoraRTMConfig'

export class AgoraRTMService {
	private client: AgoraRTM.RtmClient | null = null
	private channel: AgoraRTM.RtmChannel | null = null

	async createClient() {
		if (this.client) {
			return this.client
		}

		this.client = AgoraRTM.createInstance(agoraRTMConfig.appId)
		return this.client
	}

	async login(uid: string, token?: string) {
		const client = await this.createClient()
		await client.login({ uid, token })
		return client
	}

	async logout() {
		if (this.client) {
			await this.client.logout()
			this.client = null
		}
	}

	async joinChannel(channelName: string) {
		if (!this.client) {
			throw new Error('Client not logged in')
		}

		this.channel = this.client.createChannel(channelName)
		await this.channel.join()
		return this.channel
	}

	async leaveChannel() {
		if (this.channel) {
			await this.channel.leave()
			this.channel = null
		}
	}

	async sendMessage(message: string) {
		if (!this.channel) {
			throw new Error('Not in a channel')
		}

		await this.channel.sendMessage({ text: message })
	}

	onMessage(callback: (message: AgoraRTM.RtmMessage, peerId: string) => void) {
		if (this.channel) {
			this.channel.on('ChannelMessage', callback)
		}
	}

	cleanup() {
		this.leaveChannel()
		this.logout()
	}
}

export const agoraRTMService = new AgoraRTMService()
```

### 5. React Hooks

**`hooks/useAgoraRTC.ts`:**

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'
import { agoraRTCService } from '@/services/agora/agoraRTCService'
import AgoraRTC from 'agora-rtc-sdk-ng'

export function useAgoraRTC() {
	const [isConnected, setIsConnected] = useState(false)
	const [localTracks, setLocalTracks] = useState<AgoraRTC.ILocalTrack[]>([])
	const [remoteUsers, setRemoteUsers] = useState<AgoraRTC.IAgoraRTCClient['remoteUsers']>([])
	const clientRef = useRef<AgoraRTC.IAgoraRTCClient | null>(null)

	useEffect(() => {
		return () => {
			// Cleanup on unmount
			localTracks.forEach(track => track.stop())
			localTracks.forEach(track => track.close())
			agoraRTCService.cleanup()
		}
	}, [])

	const joinChannel = async (
		token: string,
		channelName: string,
		uid?: string | number
	) => {
		try {
			const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
			if (!appId) {
				throw new Error('Agora App ID not configured')
			}

			const client = await agoraRTCService.initialize(appId)
			clientRef.current = client

			// Create local tracks
			const tracks = await agoraRTCService.createLocalTracks()
			setLocalTracks(tracks)

			// Join channel
			await agoraRTCService.joinChannel(token, channelName, uid)

			// Publish tracks
			await agoraRTCService.publishTracks(tracks)

			// Handle remote users
			client.on('user-published', async (user, mediaType) => {
				await client.subscribe(user, mediaType)
				setRemoteUsers([...client.remoteUsers])
			})

			client.on('user-unpublished', () => {
				setRemoteUsers([...client.remoteUsers])
			})

			setIsConnected(true)
		} catch (error) {
			console.error('Join channel error:', error)
			throw error
		}
	}

	const leaveChannel = async () => {
		try {
			localTracks.forEach(track => track.stop())
			localTracks.forEach(track => track.close())
			await agoraRTCService.leaveChannel()
			setLocalTracks([])
			setRemoteUsers([])
			setIsConnected(false)
		} catch (error) {
			console.error('Leave channel error:', error)
			throw error
		}
	}

	return {
		isConnected,
		localTracks,
		remoteUsers,
		joinChannel,
		leaveChannel,
	}
}
```

**`hooks/useAgoraAI.ts`:**

```typescript
'use client'

import { useState, useCallback } from 'react'
import { agoraAIService, AgoraAIRequest, AgoraAIResponse } from '@/services/agora/agoraAIService'

export function useAgoraAI() {
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [conversationId, setConversationId] = useState<string | null>(null)

	const sendMessage = useCallback(
		async (message: string, context?: Record<string, any>): Promise<AgoraAIResponse> => {
			setIsLoading(true)
			setError(null)

			try {
				const request: AgoraAIRequest = {
					message,
					conversationId: conversationId || undefined,
					context,
				}

				const response = await agoraAIService.sendMessage(request)

				if (response.conversationId && !conversationId) {
					setConversationId(response.conversationId)
				}

				return response
			} catch (err) {
				const error = err instanceof Error ? err : new Error('Unknown error')
				setError(error)
				throw error
			} finally {
				setIsLoading(false)
			}
		},
		[conversationId]
	)

	const recognizeIntent = useCallback(async (message: string) => {
		setIsLoading(true)
		setError(null)

		try {
			return await agoraAIService.recognizeIntent(message)
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Unknown error')
			setError(error)
			throw error
		} finally {
			setIsLoading(false)
		}
	}, [])

	return {
		sendMessage,
		recognizeIntent,
		isLoading,
		error,
		conversationId,
	}
}
```

### 6. Example Components

**`components/agents/AgentChat.tsx`:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAgoraAI } from '@/hooks/useAgoraAI'
import { useAgoraRTM } from '@/hooks/useAgoraRTM'

interface Message {
	id: string
	text: string
	sender: 'user' | 'agent'
	timestamp: Date
}

export function AgentChat() {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState('')
	const { sendMessage, isLoading } = useAgoraAI()
	const { sendMessage: sendRTM, isConnected } = useAgoraRTM()

	const handleSend = async () => {
		if (!input.trim()) return

		const userMessage: Message = {
			id: Date.now().toString(),
			text: input,
			sender: 'user',
			timestamp: new Date(),
		}

		setMessages(prev => [...prev, userMessage])
		setInput('')

		try {
			// Send to Agora AI
			const response = await sendMessage(input)

			const agentMessage: Message = {
				id: (Date.now() + 1).toString(),
				text: response.response,
				sender: 'agent',
				timestamp: new Date(),
			}

			setMessages(prev => [...prev, agentMessage])

			// Also send via RTM for real-time sync
			if (isConnected) {
				await sendRTM(response.response)
			}
		} catch (error) {
			console.error('Error sending message:', error)
		}
	}

	return (
		<div className="flex flex-col h-screen">
			<div className="flex-1 overflow-y-auto p-4">
				{messages.map(message => (
					<div
						key={message.id}
						className={`mb-4 ${
							message.sender === 'user' ? 'text-right' : 'text-left'
						}`}
					>
						<div
							className={`inline-block p-3 rounded-lg ${
								message.sender === 'user'
									? 'bg-blue-500 text-white'
									: 'bg-gray-200 text-gray-800'
							}`}
						>
							{message.text}
						</div>
					</div>
				))}
				{isLoading && (
					<div className="text-left">
						<div className="inline-block p-3 rounded-lg bg-gray-200">
							Thinking...
						</div>
					</div>
				)}
			</div>
			<div className="border-t p-4">
				<div className="flex gap-2">
					<input
						type="text"
						value={input}
						onChange={e => setInput(e.target.value)}
						onKeyPress={e => e.key === 'Enter' && handleSend()}
						className="flex-1 p-2 border rounded"
						placeholder="Type your message..."
					/>
					<button
						onClick={handleSend}
						disabled={isLoading || !input.trim()}
						className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
					>
						Send
					</button>
				</div>
			</div>
		</div>
	)
}
```

## Next Steps

1. **Set up environment variables** in `.env.local`
2. **Install required packages** using npm
3. **Create API routes** for token generation
4. **Implement components** using the examples above
5. **Integrate with AWS services** for storage and backend
6. **Test the integration** with your Agora credentials

## Resources

- [Agora Web SDK Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web)
- [Agora RTM SDK Documentation](https://docs.agora.io/en/real-time-messaging/get-started/get-started-sdk?platform=web)
- [Agora REST API Documentation](https://docs.agora.io/en/api-reference)
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)

## Important Notes

1. **SSR Handling:** Always use dynamic imports with `ssr: false` for Agora SDK components
2. **Token Security:** Never expose App Certificate in client-side code
3. **Error Handling:** Implement proper error handling and retry logic
4. **Cleanup:** Always cleanup tracks and connections on component unmount
5. **AWS Integration:** Use AWS services for token generation, storage, and authentication

