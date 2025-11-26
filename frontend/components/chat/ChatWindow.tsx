'use client'

import { useState, useEffect } from 'react'
import { useAgoraRTM } from '@/hooks/useAgoraRTM'

export default function ChatWindow() {
	const [input, setInput] = useState('')
	const [userId, setUserId] = useState('')
	const [token, setToken] = useState('')
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
			// Use token if provided, otherwise pass undefined
			await login(userId, token || undefined)
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
		<div className="flex flex-col h-screen max-w-4xl mx-auto p-4 bg-white">
			{/* Header */}
			<div className="border-b-2 border-gray-300 pb-4 mb-4">
				<h1 className="text-3xl font-bold mb-2 text-gray-900">Agora RTM Chat</h1>
			{error && (
				<div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded text-sm mb-2">
					<strong className="block mb-1">Error:</strong>
					<div className="mb-2">{error.message}</div>
					{error.message.includes('RTM service is not enabled') && (
						<div className="mt-2 text-xs bg-red-100 p-2 rounded">
							<strong>How to fix:</strong>
							<ol className="list-decimal list-inside mt-1 space-y-1">
								<li>Go to <a href="https://console.agora.io/" target="_blank" rel="noopener noreferrer" className="underline">Agora Console</a></li>
								<li>Navigate to your project</li>
								<li>Go to <strong>Project Management</strong> → <strong>Edit</strong></li>
								<li>Find <strong>RTM Service</strong> and <strong>Enable</strong> it</li>
								<li>Save changes and try again</li>
							</ol>
						</div>
					)}
					{error.message.includes('Token authentication') && (
						<div className="mt-2 text-xs bg-red-100 p-2 rounded">
							<strong>How to fix:</strong>
							<ol className="list-decimal list-inside mt-1 space-y-1">
								<li>Generate a token in Agora Console, or</li>
								<li>Disable App Certificate in Project Settings</li>
								<li>See <code className="bg-red-200 px-1 rounded">docs/agora/TOKEN_SETUP.md</code> for details</li>
							</ol>
						</div>
					)}
				</div>
			)}
			</div>

			{/* Login Section */}
			{!isLoggedIn && (
				<div className="border-2 border-gray-300 rounded-lg p-6 mb-4 bg-gray-50 shadow-sm">
					<div className="mb-4">
						<label className="block text-sm font-semibold mb-2 text-gray-900">
							User ID <span className="text-red-600">*</span>
						</label>
						<input
							type="text"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							className="w-full p-3 border-2 border-gray-400 rounded-md focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
							placeholder="Enter user ID"
							required
						/>
					</div>
					<div className="mb-4">
						<label className="block text-sm font-semibold mb-2 text-gray-900">
							Token <span className="text-gray-500 text-xs">(Required if App Certificate is enabled)</span>
						</label>
						<input
							type="text"
							value={token}
							onChange={(e) => setToken(e.target.value)}
							className="w-full p-3 border-2 border-gray-400 rounded-md focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
							placeholder="Enter token (leave empty if not required)"
						/>
						<p className="text-xs text-gray-600 mt-1">
							If your Agora project has App Certificate enabled, you need to generate a token.
							For development, you can disable App Certificate in Agora Console or generate a token.
						</p>
					</div>
					<button
						onClick={handleLogin}
						disabled={!userId.trim()}
						className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
					>
						Login
					</button>
				</div>
			)}

			{/* Channel Join Section */}
			{isLoggedIn && !isInChannel && (
				<div className="border-2 border-gray-300 rounded-lg p-6 mb-4 bg-gray-50 shadow-sm">
					<div className="mb-4">
						<label className="block text-sm font-semibold mb-2 text-gray-900">
							Channel Name
						</label>
						<input
							type="text"
							value={channelName}
							onChange={(e) => setChannelName(e.target.value)}
							className="w-full p-3 border-2 border-gray-400 rounded-md focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
							placeholder="Enter channel name"
							onKeyPress={(e) => e.key === 'Enter' && handleJoinChannel()}
						/>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleJoinChannel}
							className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
						>
							Join Channel
						</button>
						<button
							onClick={logout}
							className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
						>
							Logout
						</button>
					</div>
				</div>
			)}

			{/* Chat Section */}
			{isInChannel && (
				<>
					<div className="flex-1 overflow-y-auto border-2 border-gray-300 rounded-lg p-4 mb-4 bg-gray-50 shadow-sm">
						<div className="mb-3 text-sm font-medium text-gray-700 bg-white p-2 rounded border border-gray-300">
							Logged in as: <strong className="text-gray-900">{currentUid}</strong> | Channel:{' '}
							<strong className="text-gray-900">{channelName}</strong>
						</div>
						<div className="space-y-3">
							{messages.length === 0 && (
								<div className="text-center text-gray-500 py-8">
									No messages yet. Start the conversation!
								</div>
							)}
							{messages.map((message) => (
								<div
									key={message.id}
									className={`p-3 rounded-lg ${
										message.uid === currentUid
											? 'bg-blue-600 text-white ml-auto text-right max-w-[80%]'
											: 'bg-white text-gray-900 border-2 border-gray-300 max-w-[80%]'
									}`}
								>
									<div className={`text-xs mb-1 ${
										message.uid === currentUid
											? 'text-blue-100'
											: 'text-gray-600'
									}`}>
										{message.uid} ({new Date(message.timestamp).toLocaleTimeString()})
									</div>
									<div className={`font-medium ${
										message.uid === currentUid
											? 'text-white'
											: 'text-gray-900'
									}`}>
										{message.text}
									</div>
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
							className="flex-1 p-3 border-2 border-gray-400 rounded-md focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
							placeholder="Type your message..."
						/>
						<button
							onClick={handleSendMessage}
							disabled={!input.trim()}
							className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
						>
							Send
						</button>
						<button
							onClick={leaveChannel}
							className="px-6 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
						>
							Leave
						</button>
					</div>
				</>
			)}
		</div>
	)
}

