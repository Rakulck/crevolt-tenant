# Environment Variables Configuration

This document outlines all the environment variables required for the CREvolt Tenant application.

## Required Environment Variables

### OpenAI Configuration
```bash
OPENAI_API_KEY=your_openai_api_key_here
```
- **Purpose**: Required for AI-powered document analysis and tenant risk assessment
- **Where to get**: OpenAI Platform (https://platform.openai.com/api-keys)
- **Usage**: Document analyzers, rent roll analysis, tenant default prediction

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
- **Purpose**: Database and authentication backend
- **Where to get**: Supabase Dashboard > Settings > API
- **Usage**: User authentication, property management, data storage

### Optional Environment Variables

#### Google Maps (Optional)
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```
- **Purpose**: Map integration for property locations
- **Where to get**: Google Cloud Console > APIs & Services > Credentials

#### Development
```bash
NODE_ENV=development
```
- **Purpose**: Application environment mode
- **Default**: `development` for local, `production` for deployed

## Deployment Instructions

### Local Development
1. Create a `.env.local` file in the project root
2. Copy the variables from this document and fill in your values
3. Never commit `.env.local` to version control

### Production Deployment

#### Vercel
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable with its corresponding value
4. Ensure they're set for the "Production" environment

#### Netlify
1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add each variable with its corresponding value

#### Other Platforms
Consult your deployment platform's documentation for setting environment variables.

## Security Notes

- Keep all API keys and secrets confidential
- Use different API keys for development and production
- Regularly rotate your API keys
- Monitor API usage and costs

## Troubleshooting

### Build Errors
If you encounter build errors related to missing environment variables:

1. Ensure all required variables are set in your deployment platform
2. Check that variable names match exactly (case-sensitive)
3. Verify API keys are valid and have necessary permissions

### Runtime Errors
If the application builds but fails at runtime:

1. Check browser console for specific error messages
2. Verify API keys have sufficient credits/permissions
3. Test API connections independently 