export const agoraRTMConfig = {
	appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
}

if (!agoraRTMConfig.appId) {
	console.warn('Agora App ID is not configured. Please set NEXT_PUBLIC_AGORA_APP_ID in .env.local')
}

