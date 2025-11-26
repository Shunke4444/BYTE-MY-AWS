# Agora RTM Setup Guide

## Common Errors and Solutions

### Error: -10015 - RTM service is not enabled

**Solution:** Enable RTM service in Agora Console

1. Go to [Agora Console](https://console.agora.io/)
2. Navigate to your project
3. Go to **Project Management** > **Edit**
4. Find **RTM Service** (or **Real-Time Messaging**)
5. **Enable** the RTM service
6. Save changes

**Note:** RTM must be enabled before you can use it. This is a one-time setup per project.

---

### Error: -10005 - DYNAMIC_ENABLED_BUT_STATIC_KEY

If you're seeing this error, your Agora project has **App Certificate** enabled, which requires token-based authentication.

## Solution Options

### Option 1: Disable App Certificate (Development Only)

1. Go to [Agora Console](https://console.agora.io/)
2. Navigate to your project
3. Go to **Project Management** > **Edit**
4. Find **App Certificate** and **disable** it
5. Save changes

**Note:** This is only recommended for development/testing. Production should use tokens.

### Option 2: Generate a Token (Recommended for Production)

#### Using Agora Console (Temporary Token for Testing)

1. Go to [Agora Console](https://console.agora.io/)
2. Navigate to your project
3. Go to **Project Management** > **Edit**
4. Click **Generate Temp Token**
5. Enter your User ID
6. Copy the generated token
7. Use this token in the chat interface

#### Using Token Server (Production)

For production, you should set up a token server. See Agora's documentation:
- [Token Server Guide](https://docs.agora.io/en/Video/token_server?platform=All%20Platforms)
- [RTM Token Generator](https://www.agora.io/en/blog/agora-rtm-token-generator/)

## Using Tokens in the Chat Interface

1. Enter your **User ID**
2. Enter the **Token** (if App Certificate is enabled)
3. Click **Login**

If App Certificate is disabled, you can leave the token field empty.

