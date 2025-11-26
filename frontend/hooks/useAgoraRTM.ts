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

