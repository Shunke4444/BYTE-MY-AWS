# Agora RTM (Real-Time Messaging) Integration Guide for Next.js

## Overview

This guide focuses exclusively on integrating **Agora RTM SDK** into your Next.js project for real-time messaging capabilities. No AWS services are required for basic RTM functionality.

## What is Agora RTM?

Agora RTM (Real-Time Messaging) SDK enables:
- **Peer-to-peer messaging** - Direct messages between users
- **Channel messaging** - Group chat in channels
- **Presence** - User online/offline status
- **Storage** - Key-value storage for user data
- **File sharing** - Send files and images

## Prerequisites

1. **Agora Account Setup:**
   - Sign up at [Agora Console](https://console.agora.io/)
   - Create a new project
   - Get your **App ID** (no certificate needed for basic RTM)
   - Store App ID securely

## Installation

### Install Agora RTM SDK

```bash
npm install agora-rtm-sdk
```

### TypeScript Support

```bash
npm install --save-dev @types/node
```

## Project Structure

```
frontend/
  app/
    chat/
      page.tsx              # Chat page
    api/
      agora/
        rtm-token/
          route.ts          # RTM token generation (optional)
  components/
    chat/
      ChatWindow.tsx        # Main chat component
      MessageList.tsx       # Message display
      MessageInput.tsx      # Message input
  hooks/
    useAgoraRTM.ts         # RTM hook
  services/
    agora/
      agoraRTMService.ts    # RTM service
  lib/
    agora/
      agoraRTMConfig.ts    # RTM configuration
```

## Configuration

### 1. Environment Variables

Create `.env.local`:

```env
# Agora RTM Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
```

**Note:** For production, you may want to generate RTM tokens server-side. For development, you can use the App ID directly.

### 2. RTM Configuration

**`lib/agora/agoraRTMConfig.ts`:**

```typescript
export const agoraRTMConfig = {
	appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
}

if (!agoraRTMConfig.appId) {
	console.warn('Agora App ID is not configured. Please set NEXT_PUBLIC_AGORA_APP_ID in .env.local')
}
```

## Implementation

### 1. RTM Service

**`services/agora/agoraRTMService.ts`:**

```typescript
'use client'

import AgoraRTM from 'agora-rtm-sdk'
import { agoraRTMConfig } from '@/lib/agora/agoraRTMConfig'

export interface RTMMessage {
	text: string
	messageType?: 'TEXT' | 'RAW'
}

export interface RTMChannelMessage {
	text: string
	uid: string
	messageType?: 'TEXT' | 'RAW'
}

export class AgoraRTMService {
	private client: AgoraRTM.RtmClient | null = null
	private channel: AgoraRTM.RtmChannel | null = null
	private isLoggedIn: boolean = false
	private currentUid: string = ''

	/**
	 * Create RTM client instance
	 */
	createClient(): AgoraRTM.RtmClient {
		if (this.client) {
			return this.client
		}

		if (!agoraRTMConfig.appId) {
			throw new Error('Agora App ID is not configured')
		}

		this.client = AgoraRTM.createInstance(agoraRTMConfig.appId)
		return this.client
	}

	/**
	 * Login to RTM service
	 * @param uid - Unique user identifier
	 * @param token - Optional token (for production)
	 */
	async login(uid: string, token?: string): Promise<void> {
		const client = this.createClient()

		try {
			await client.login({ uid, token })
			this.isLoggedIn = true
			this.currentUid = uid
		} catch (error) {
			console.error('RTM login error:', error)
			throw error
		}
	}

	/**
	 * Logout from RTM service
	 */
	async logout(): Promise<void> {
		if (this.channel) {
			await this.leaveChannel()
		}

		if (this.client && this.isLoggedIn) {
			try {
				await this.client.logout()
				this.isLoggedIn = false
				this.currentUid = ''
			} catch (error) {
				console.error('RTM logout error:', error)
			}
		}
	}

	/**
	 * Join a channel
	 * @param channelName - Name of the channel to join
	 */
	async joinChannel(channelName: string): Promise<AgoraRTM.RtmChannel> {
		if (!this.client || !this.isLoggedIn) {
			throw new Error('Must be logged in before joining a channel')
		}

		if (this.channel) {
			throw new Error('Already in a channel. Leave current channel first.')
		}

		try {
			this.channel = this.client.createChannel(channelName)
			await this.channel.join()
			return this.channel
		} catch (error) {
			console.error('Join channel error:', error)
			throw error
		}
	}

	/**
	 * Leave current channel
	 */
	async leaveChannel(): Promise<void> {
		if (this.channel) {
			try {
				await this.channel.leave()
				this.channel = null
			} catch (error) {
				console.error('Leave channel error:', error)
				throw error
			}
		}
	}

	/**
	 * Send peer-to-peer message
	 * @param peerId - Target user ID
	 * @param message - Message content
	 */
	async sendPeerMessage(peerId: string, message: RTMMessage): Promise<void> {
		if (!this.client || !this.isLoggedIn) {
			throw new Error('Must be logged in to send messages')
		}

		try {
			await this.client.sendMessageToPeer(
				{ text: message.text },
				peerId
			)
		} catch (error) {
			console.error('Send peer message error:', error)
			throw error
		}
	}

	/**
	 * Send channel message
	 * @param message - Message content
	 */
	async sendChannelMessage(message: RTMMessage): Promise<void> {
		if (!this.channel) {
			throw new Error('Must be in a channel to send channel messages')
		}

		try {
			await this.channel.sendMessage({ text: message.text })
		} catch (error) {
			console.error('Send channel message error:', error)
			throw error
		}
	}

	/**
	 * Subscribe to peer messages
	 * @param callback - Callback function for received messages
	 */
	onPeerMessage(
		callback: (message: AgoraRTM.RtmMessage, peerId: string) => void
	): void {
		if (!this.client) {
			throw new Error('Client not initialized')
		}

		this.client.on('MessageFromPeer', callback)
	}

	/**
	 * Subscribe to channel messages
	 * @param callback - Callback function for received messages
	 */
	onChannelMessage(
		callback: (message: AgoraRTM.RtmMessage, memberId: string) => void
	): void {
		if (!this.channel) {
			throw new Error('Not in a channel')
		}

		this.channel.on('ChannelMessage', callback)
	}

	/**
	 * Subscribe to member join events
	 * @param callback - Callback function when member joins
	 */
	onMemberJoined(callback: (memberId: string) => void): void {
		if (!this.channel) {
			throw new Error('Not in a channel')
		}

		this.channel.on('MemberJoined', callback)
	}

	/**
	 * Subscribe to member leave events
	 * @param callback - Callback function when member leaves
	 */
	onMemberLeft(callback: (memberId: string) => void): void {
		if (!this.channel) {
			throw new Error('Not in a channel')
		}

		this.channel.on('MemberLeft', callback)
	}

	/**
	 * Get current user ID
	 */
	getCurrentUid(): string {
		return this.currentUid
	}

	/**
	 * Check if logged in
	 */
	getIsLoggedIn(): boolean {
		return this.isLoggedIn
	}

	/**
	 * Check if in a channel
	 */
	getIsInChannel(): boolean {
		return this.channel !== null
	}

	/**
	 * Cleanup - logout and remove all listeners
	 */
	async cleanup(): Promise<void> {
		await this.leaveChannel()
		await this.logout()

		if (this.client) {
			// Remove all event listeners
			this.client.removeAllListeners()
			this.client = null
		}
	}
}

// Export singleton instance
export const agoraRTMService = new AgoraRTMService()
```

### 2. React Hook

**`hooks/useAgoraRTM.ts`:**

```typescript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { agoraRTMService } from '@/services/agora/agoraRTMService'
import type AgoraRTM from 'agora-rtm-sdk'

export interface Message {
	id: string
	text: string
	uid: string
	timestamp: number
	type: 'peer' | 'channel'
}

export function useAgoraRTM() {
	const [isLoggedIn, setIsLoggedIn] = useState(false)
	const [isInChannel, setIsInChannel] = useState(false)
	const [messages, setMessages] = useState<Message[]>([])
	const [currentUid, setCurrentUid] = useState<string>('')
	const [error, setError] = useState<Error | null>(null)
	const channelNameRef = useRef<string>('')

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			agoraRTMService.cleanup().catch(console.error)
		}
	}, [])

	/**
	 * Login to RTM service
	 */
	const login = useCallback(async (uid: string, token?: string) => {
		try {
			setError(null)
			await agoraRTMService.login(uid, token)
			setIsLoggedIn(true)
			setCurrentUid(uid)

			// Set up peer message listener
			agoraRTMService.onPeerMessage((message, peerId) => {
				const newMessage: Message = {
					id: `${Date.now()}-${peerId}`,
					text: (message as AgoraRTM.TextMessage).text || '',
					uid: peerId,
					timestamp: Date.now(),
					type: 'peer',
				}
				setMessages(prev => [...prev, newMessage])
			})
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Login failed')
			setError(error)
			throw error
		}
	}, [])

	/**
	 * Logout from RTM service
	 */
	const logout = useCallback(async () => {
		try {
			setError(null)
			await agoraRTMService.logout()
			setIsLoggedIn(false)
			setCurrentUid('')
			setMessages([])
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Logout failed')
			setError(error)
			throw error
		}
	}, [])

	/**
	 * Join a channel
	 */
	const joinChannel = useCallback(async (channelName: string) => {
		try {
			setError(null)
			await agoraRTMService.joinChannel(channelName)
			channelNameRef.current = channelName
			setIsInChannel(true)

			// Set up channel message listener
			agoraRTMService.onChannelMessage((message, memberId) => {
				const newMessage: Message = {
					id: `${Date.now()}-${memberId}`,
					text: (message as AgoraRTM.TextMessage).text || '',
					uid: memberId,
					timestamp: Date.now(),
					type: 'channel',
				}
				setMessages(prev => [...prev, newMessage])
			})

			// Set up member join/leave listeners
			agoraRTMService.onMemberJoined((memberId) => {
				console.log(`Member ${memberId} joined`)
			})

			agoraRTMService.onMemberLeft((memberId) => {
				console.log(`Member ${memberId} left`)
			})
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Join channel failed')
			setError(error)
			throw error
		}
	}, [])

	/**
	 * Leave current channel
	 */
	const leaveChannel = useCallback(async () => {
		try {
			setError(null)
			await agoraRTMService.leaveChannel()
			setIsInChannel(false)
			channelNameRef.current = ''
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Leave channel failed')
			setError(error)
			throw error
		}
	}, [])

	/**
	 * Send peer-to-peer message
	 */
	const sendPeerMessage = useCallback(async (peerId: string, text: string) => {
		try {
			setError(null)
			await agoraRTMService.sendPeerMessage(peerId, { text })

			// Add message to local state (sent message)
			const newMessage: Message = {
				id: `${Date.now()}-${currentUid}`,
				text,
				uid: currentUid,
				timestamp: Date.now(),
				type: 'peer',
			}
			setMessages(prev => [...prev, newMessage])
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Send message failed')
			setError(error)
			throw error
		}
	}, [currentUid])

	/**
	 * Send channel message
	 */
	const sendChannelMessage = useCallback(async (text: string) => {
		try {
			setError(null)
			await agoraRTMService.sendChannelMessage({ text })

			// Add message to local state (sent message)
			const newMessage: Message = {
				id: `${Date.now()}-${currentUid}`,
				text,
				uid: currentUid,
				timestamp: Date.now(),
				type: 'channel',
			}
			setMessages(prev => [...prev, newMessage])
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Send message failed')
			setError(error)
			throw error
		}
	}, [currentUid])

	/**
	 * Clear messages
	 */
	const clearMessages = useCallback(() => {
		setMessages([])
	}, [])

	return {
		// State
		isLoggedIn,
		isInChannel,
		messages,
		currentUid,
		error,
		channelName: channelNameRef.current,

		// Actions
		login,
		logout,
		joinChannel,
		leaveChannel,
		sendPeerMessage,
		sendChannelMessage,
		clearMessages,
	}
}
```

### 3. Chat Component Example

**`components/chat/ChatWindow.tsx`:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useAgoraRTM } from '@/hooks/useAgoraRTM'

export function ChatWindow() {
	const [input, setInput] = useState('')
	const [userId, setUserId] = useState('')
	const [channelName, setChannelName] = useState('')
	const [isInitialized, setIsInitialized] = useState(false)

	const {
		isLoggedIn,
		isInChannel,
		messages,
		currentUid,
		error,
		login,
		logout,
		joinChannel,
		leaveChannel,
		sendChannelMessage,
	} = useAgoraRTM()

	// Initialize on mount
	useEffect(() => {
		// Generate a random user ID for demo
		const randomUid = `user_${Math.random().toString(36).substr(2, 9)}`
		setUserId(randomUid)
	}, [])

	const handleLogin = async () => {
		try {
			await login(userId)
			setIsInitialized(true)
		} catch (err) {
			console.error('Login failed:', err)
		}
	}

	const handleJoinChannel = async () => {
		if (!channelName.trim()) {
			alert('Please enter a channel name')
			return
		}

		try {
			await joinChannel(channelName)
		} catch (err) {
			console.error('Join channel failed:', err)
		}
	}

	const handleSendMessage = async () => {
		if (!input.trim()) return

		try {
			await sendChannelMessage(input)
			setInput('')
		} catch (err) {
			console.error('Send message failed:', err)
		}
	}

	return (
		<div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
			{/* Header */}
			<div className="border-b pb-4 mb-4">
				<h1 className="text-2xl font-bold mb-2">Agora RTM Chat</h1>
				{error && (
					<div className="text-red-500 text-sm mb-2">
						Error: {error.message}
					</div>
				)}
			</div>

			{/* Login Section */}
			{!isLoggedIn && (
				<div className="border rounded-lg p-4 mb-4">
					<div className="mb-2">
						<label className="block text-sm font-medium mb-1">
							User ID
						</label>
						<input
							type="text"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							className="w-full p-2 border rounded"
							placeholder="Enter user ID"
						/>
					</div>
					<button
						onClick={handleLogin}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Login
					</button>
				</div>
			)}

			{/* Channel Join Section */}
			{isLoggedIn && !isInChannel && (
				<div className="border rounded-lg p-4 mb-4">
					<div className="mb-2">
						<label className="block text-sm font-medium mb-1">
							Channel Name
						</label>
						<input
							type="text"
							value={channelName}
							onChange={(e) => setChannelName(e.target.value)}
							className="w-full p-2 border rounded"
							placeholder="Enter channel name"
							onKeyPress={(e) => e.key === 'Enter' && handleJoinChannel()}
						/>
					</div>
					<button
						onClick={handleJoinChannel}
						className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
					>
						Join Channel
					</button>
					<button
						onClick={logout}
						className="ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
					>
						Logout
					</button>
				</div>
			)}

			{/* Chat Section */}
			{isInChannel && (
				<>
					<div className="flex-1 overflow-y-auto border rounded-lg p-4 mb-4">
						<div className="mb-2 text-sm text-gray-600">
							Logged in as: <strong>{currentUid}</strong> | Channel:{' '}
							<strong>{channelName}</strong>
						</div>
						<div className="space-y-2">
							{messages.map((message) => (
								<div
									key={message.id}
									className={`p-2 rounded ${
										message.uid === currentUid
											? 'bg-blue-100 ml-auto text-right'
											: 'bg-gray-100'
									}`}
								>
									<div className="text-xs text-gray-500 mb-1">
										{message.uid} ({new Date(message.timestamp).toLocaleTimeString()})
									</div>
									<div>{message.text}</div>
								</div>
							))}
						</div>
					</div>

					{/* Input Section */}
					<div className="flex gap-2">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
							className="flex-1 p-2 border rounded"
							placeholder="Type your message..."
						/>
						<button
							onClick={handleSendMessage}
							disabled={!input.trim()}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
						>
							Send
						</button>
						<button
							onClick={leaveChannel}
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						>
							Leave
						</button>
					</div>
				</>
			)}
		</div>
	)
}
```

### 4. Page Implementation

**`app/chat/page.tsx`:**

```typescript
import dynamic from 'next/dynamic'

// Disable SSR for Agora RTM components
const ChatWindow = dynamic(() => import('@/components/chat/ChatWindow'), {
	ssr: false,
})

export default function ChatPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<ChatWindow />
		</div>
	)
}
```

## Usage Example

### Basic Flow

1. **Login:**
```typescript
await agoraRTMService.login('user123')
```

2. **Join Channel:**
```typescript
await agoraRTMService.joinChannel('general')
```

3. **Send Message:**
```typescript
await agoraRTMService.sendChannelMessage({ text: 'Hello, world!' })
```

4. **Receive Messages:**
```typescript
agoraRTMService.onChannelMessage((message, memberId) => {
  console.log(`Message from ${memberId}:`, message.text)
})
```

5. **Cleanup:**
```typescript
await agoraRTMService.cleanup()
```

## Important Notes

### 1. SSR Handling
Always use dynamic imports with `ssr: false` for components using Agora RTM:

```typescript
import dynamic from 'next/dynamic'

const ChatComponent = dynamic(() => import('./ChatComponent'), {
  ssr: false,
})
```

### 2. Client-Side Only
Agora RTM SDK must run in the browser. Mark files with `'use client'` directive.

### 3. Error Handling
Always implement proper error handling for:
- Network failures
- Connection timeouts
- Invalid credentials
- Channel join failures

### 4. Cleanup
Always cleanup on component unmount:
```typescript
useEffect(() => {
  return () => {
    agoraRTMService.cleanup()
  }
}, [])
```

## Testing

1. **Start development server:**
```bash
npm run dev
```

2. **Open multiple browser tabs/windows:**
   - Navigate to `/chat`
   - Login with different user IDs
   - Join the same channel
   - Send messages and see them appear in all tabs

## Common Issues

### "App ID is not configured"
- Check `.env.local` file exists
- Verify `NEXT_PUBLIC_AGORA_APP_ID` is set
- Restart dev server after adding env variables

### "window is not defined"
- Use dynamic imports with `ssr: false`
- Ensure component has `'use client'` directive

### Messages not received
- Check that both users are logged in
- Verify both users joined the same channel
- Check browser console for errors

## Resources

- [Agora RTM SDK Documentation](https://docs.agora.io/en/real-time-messaging/get-started/get-started-sdk?platform=web)
- [Agora RTM API Reference](https://docs.agora.io/en/real-time-messaging/api-reference/realtime-messaging-api-overview?platform=web)
- [Agora Console](https://console.agora.io/)

## Next Steps

1. Install the SDK: `npm install agora-rtm-sdk`
2. Set up environment variables
3. Create the service and hook files
4. Build your chat component
5. Test with multiple users

