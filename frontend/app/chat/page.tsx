'use client'

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

