'use client'

import * as AgoraRTM from 'agora-rtm-sdk'
import { agoraRTMConfig } from '@/lib/agora/agoraRTMConfig'

// Type definitions for Agora RTM
type RtmClient = any
type RtmChannel = any
type RtmMessage = any

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
	private client: RtmClient | null = null
	private channel: RtmChannel | null = null
	private isLoggedIn: boolean = false
	private currentUid: string = ''

	/**
	 * Get RTM client instance
	 * Note: Client is created during login()
	 */
	getClient(): RtmClient {
		if (!this.client) {
			throw new Error('RTM client not initialized. Call login() first.')
		}
		return this.client
	}

	/**
	 * Login to RTM service
	 * @param uid - Unique user identifier
	 * @param token - Optional token (for production)
	 */
	async login(uid: string, token?: string): Promise<void> {
		// Create client with appId and userId
		// RTM constructor: new RTM(appId, userId, options?)
		if (!this.client) {
			if (!agoraRTMConfig.appId) {
				throw new Error('Agora App ID is not configured')
			}
			
			const RTM = (AgoraRTM as any).RTM
			if (!RTM || typeof RTM !== 'function') {
				throw new Error('Agora RTM SDK RTM is not available')
			}
			
			// Create RTM instance with appId and userId
			// Options: { useStringUserId: true } to allow string UIDs
			this.client = new RTM(agoraRTMConfig.appId, uid, {
				useStringUserId: true
			})
		}

		try {
			// Login with token if provided
			if (token) {
				await this.client.login({ token })
			} else {
				await this.client.login()
			}
			this.isLoggedIn = true
			this.currentUid = uid
		} catch (error: any) {
			console.error('RTM login error:', error)
			
			// Provide helpful error messages for common issues
			if (error?.code === -10015) {
				throw new Error(
					'RTM service is not enabled. Please enable RTM in Agora Console: ' +
					'Project Management > Edit > Enable RTM service'
				)
			}
			
			if (error?.code === -10005) {
				throw new Error(
					'Token authentication required. Your project has App Certificate enabled. ' +
					'Please provide a valid token or disable App Certificate in Agora Console.'
				)
			}
			
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
	async joinChannel(channelName: string): Promise<RtmChannel> {
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
		callback: (message: RtmMessage, peerId: string) => void
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
		callback: (message: RtmMessage, memberId: string) => void
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

