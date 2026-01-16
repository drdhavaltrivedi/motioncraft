<div align="center">

# 🎬 MotionCraft

**Where Words Come to Life**

Transform simple text into stunning cinematic animations using AI-powered generative models.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19.2.1-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-6.2.0-purple.svg)](https://vitejs.dev/)

</div>

---

## ✨ Features

- 🎨 **Cinematic Text Animations** - Generate stunning 3D text animations with AI
- 🖼️ **Style Customization** - Customize visual styles, typography, and environments
- 🎭 **Reference Images** - Use reference images to match specific visual styles
- 🌓 **Dark/Light Mode** - Beautiful theme switching with persistent preferences
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎬 **Video Generation** - Powered by Google's Veo 3.1 model for high-quality video output
- 🎁 **GIF Export** - Download your creations as animated GIFs

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- **Google Gemini API Key** with billing enabled (required for Veo models)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/drdhavaltrivedi/motioncraft.git
   cd motioncraft
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   
   > ⚠️ **Note:** You need a Google Cloud project with billing enabled to use Veo models for video generation.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000` to see the app in action!

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add the `GEMINI_API_KEY` environment variable in Vercel dashboard
4. Deploy! 🚀

The app is automatically configured for Vercel deployment with the included `vercel.json`.

## 🛠️ Tech Stack

- **Framework:** React 19.2.1
- **Build Tool:** Vite 6.2.0
- **Language:** TypeScript
- **Styling:** Tailwind CSS (via CDN)
- **AI Models:** 
  - Google Gemini 3 Flash (for style suggestions)
  - Google Gemini 3 Pro Image (for image generation)
  - Google Veo 3.1 (for video generation)
- **Icons:** Lucide React
- **GIF Generation:** gifenc

## 📁 Project Structure

```
motioncraft/
├── services/
│   └── geminiService.ts    # AI service integration
├── App.tsx                  # Main application component
├── index.tsx               # Application entry point
├── types.ts                # TypeScript type definitions
├── utils.ts                # Utility functions
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies and scripts
```

## 🎯 Usage

1. **Enter your text** - Type the word or phrase you want to animate
2. **Customize style** - Describe the visual environment or use the AI suggestion feature
3. **Add typography** - Specify font aesthetics or choose from presets
4. **Optional reference** - Upload a reference image to match a specific style
5. **Generate** - Click "GENERATE MOTION ART" and watch the magic happen!

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |

### Vite Configuration

The app is configured to run on port `3000` by default. You can modify this in `vite.config.ts`.

## 📝 License

This project is licensed under the Apache-2.0 License.

## 👨‍💻 Developer

**Developed by [Dhaval Trivedi](https://github.com/drdhavaltrivedi)**

---

<div align="center">

Made with ❤️ using React, Vite, and Google Gemini AI

[Report Bug](https://github.com/drdhavaltrivedi/motioncraft/issues) · [Request Feature](https://github.com/drdhavaltrivedi/motioncraft/issues)

</div>
