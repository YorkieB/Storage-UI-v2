# CloudDrive

A self-hosted cloud storage interface built with React, Vite, and Tailwind CSS. Features AI-powered file analysis and image generation via Google Gemini.

## Features

- **File Management** — Upload, download, rename, move, star, and trash files and folders
- **Gallery & Albums** — Visual gallery view with album organisation for images and videos
- **AI Features** — File summaries, image analysis, and AI image generation (via Gemini API)
- **Dark Mode** — Full dark/light theme toggle
- **Responsive** — Desktop sidebar with mobile-friendly layout
- **Cloud Import** — Simulated import from Google Drive, OneDrive, Dropbox

## Quick Start (Local Development)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/cloud-storage-app.git
cd cloud-storage-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Gemini API key

# Start dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI features | Optional (AI features won't work without it) |

Get a Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

## Build for Production

```bash
npm run build
```

Output goes to the `dist/` directory — static files ready to serve from any web server.

## Deploy to DigitalOcean

### First-time setup

1. Create an Ubuntu 22.04+ droplet on DigitalOcean
2. Point your domain to the droplet's IP address
3. SSH into your droplet and clone the repo:

```bash
ssh root@YOUR_DROPLET_IP
git clone https://github.com/YOUR_USERNAME/cloud-storage-app.git
cd cloud-storage-app
chmod +x deploy/setup.sh deploy/redeploy.sh
sudo ./deploy/setup.sh your-domain.com
```

4. Add your Gemini API key and rebuild:

```bash
nano .env
npm run build && cp -r dist/* /var/www/clouddrive/
```

5. Set up free SSL:

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### Updating after changes

```bash
cd /path/to/cloud-storage-app
git pull origin main
./deploy/redeploy.sh
```

## Tech Stack

- **React 18** — UI framework
- **Vite 6** — Build tool and dev server
- **Tailwind CSS 3** — Utility-first styling
- **Lucide React** — Icon library
- **Google Gemini API** — AI summaries, image analysis, image generation

## Project Structure

```
cloud-storage-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── CloudStorageApp.jsx    # Main application component
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind + custom styles
├── deploy/
│   ├── nginx.conf             # Nginx site config
│   ├── setup.sh               # First-time server setup
│   └── redeploy.sh            # Quick rebuild & deploy
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## License

MIT
