# Agora Integration Quick Start

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `agora-rtc-sdk-ng` - Agora RTC SDK for video/audio
- `agora-rtm-sdk` - Agora RTM SDK for messaging
- `agora-rtc-react` - React hooks for Agora
- `agora-access-token` - Token generation utility
- AWS SDK packages for backend integration

## Step 2: Set Up Environment Variables

Create `.env.local` file in the `frontend` directory:

```env
# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_app_certificate_here

# Agora AI Configuration (if available)
AGORA_AI_API_KEY=your_ai_api_key
AGORA_AI_API_SECRET=your_ai_api_secret
AGORA_AI_BASE_URL=https://api.agora.io/v1/ai

# AWS Configuration
AWS_REGION=us-east-1
AWS_DYNAMODB_TABLE=conversations
AWS_S3_BUCKET=agent-assets
AWS_COGNITO_USER_POOL_ID=your_user_pool_id
```

**Important:** 
- Get your Agora App ID and Certificate from [Agora Console](https://console.agora.io/)
- Never commit `.env.local` to version control
- Use AWS Secrets Manager in production

## Step 3: Create Configuration Files

The guide includes example configuration files. Create them in:
- `lib/agora/agoraRTCConfig.ts`
- `lib/agora/agoraRTMConfig.ts`
- `lib/agora/agoraAIConfig.ts`

## Step 4: Create API Routes

Create token generation endpoint:
- `app/api/agora/token/route.ts`

This endpoint will generate Agora tokens server-side for security.

## Step 5: Create Services

Follow the guide to create:
- `services/agora/agoraAIService.ts` (PRIMARY)
- `services/agora/agoraRTCService.ts`
- `services/agora/agoraRTMService.ts`

## Step 6: Create React Hooks

Create custom hooks:
- `hooks/useAgoraRTC.ts`
- `hooks/useAgoraRTM.ts`
- `hooks/useAgoraAI.ts`

## Step 7: Create Components

Build your agent components:
- `components/agents/AgentChat.tsx`
- `components/agents/AgentVideoCall.tsx`
- `components/agents/AgentLiveStream.tsx`

## Step 8: Test the Integration

1. Start the development server:
```bash
npm run dev
```

2. Test token generation:
```bash
curl -X POST http://localhost:3000/api/agora/token \
  -H "Content-Type: application/json" \
  -d '{"channelName": "test", "uid": "123"}'
```

3. Test components in your pages

## Common Issues

### "window is not defined" Error

**Solution:** Use dynamic imports with SSR disabled:

```typescript
import dynamic from 'next/dynamic'

const AgentChat = dynamic(() => import('@/components/agents/AgentChat'), {
  ssr: false,
})
```

### Token Generation Fails

**Solution:** 
- Check that `AGORA_APP_CERTIFICATE` is set correctly
- Ensure token generation happens server-side
- Verify App ID and Certificate match in Agora Console

### SDK Not Loading

**Solution:**
- Ensure you're using dynamic imports for client components
- Check that `NEXT_PUBLIC_AGORA_APP_ID` is set
- Verify package installation: `npm list agora-rtc-sdk-ng`

## Next Steps

1. Read the full [AGORA_INTEGRATION_GUIDE.md](./AGORA_INTEGRATION_GUIDE.md)
2. Set up AWS services for backend
3. Implement conversation storage with DynamoDB
4. Add authentication with AWS Cognito
5. Deploy to production

## Resources

- [Agora Console](https://console.agora.io/)
- [Agora Web SDK Docs](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web)
- [Agora RTM Docs](https://docs.agora.io/en/real-time-messaging/get-started/get-started-sdk?platform=web)
- [Agora REST API](https://docs.agora.io/en/api-reference)

