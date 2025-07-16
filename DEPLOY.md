# Deploying to Cloudflare Pages

## Quick Deploy (2 minutes)

1. **Connect GitHub repo to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
   - Click "Create a project" → "Connect to Git"
   - Select your GitHub repo
   - Use these build settings:
     - Build command: `npm run build`
     - Build output directory: `dist`
     - Root directory: `/` (leave as is)

2. **Deploy!**
   - Click "Save and Deploy"
   - Wait ~2 minutes for first build
   - Your site will be live at `https://spaceboard.pages.dev`

## What This Gives You

- ✅ **Frontend**: React app served globally via Cloudflare CDN
- ✅ **API**: Cloudflare Functions handle `/api/*` routes
- ✅ **Image Proxy**: Images cached at edge locations
- ✅ **Free Tier**: 100k requests/day, unlimited bandwidth
- ✅ **Auto Deploy**: Push to main = auto deploy

## How It Works

```
spaceboard.pages.dev
├── / (React app from /dist)
└── /api/*  (Cloudflare Functions from /functions)
    ├── /api/astronauts
    └── /api/images/proxy
```

The `functions/` directory contains serverless API endpoints that run at Cloudflare edge locations worldwide. No separate backend needed!

## Custom Domain (Optional)

1. In Cloudflare Pages → Custom domains
2. Add your domain (e.g., `spaceboard.com`)
3. Follow DNS instructions
4. SSL certificate auto-provisioned

## Environment Variables (Optional)

If you need to override the API URL:
1. Settings → Environment variables
2. Add `VITE_API_URL` = `https://your-api.com`
3. Redeploy

## Monitoring

- **Analytics**: Built into Cloudflare Pages dashboard
- **Logs**: Real-time logs for Functions
- **Errors**: Automatic error tracking

That's it! No servers, no DevOps, just `git push` and done. 🚀