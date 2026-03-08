const path = require('path');
const fs = require('fs');

// Load .env from the app root so EXPO_PUBLIC_* is available when config is evaluated
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    let match = line.match(/^EXPO_PUBLIC_ANTHROPIC_API_KEY=(.+)$/);
    if (match) {
      const value = match[1].trim().replace(/^["']|["']$/g, '');
      process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = value;
      return;
    }
    match = line.match(/^EXPO_PUBLIC_OPENROUTER_API_KEY=(.+)$/);
    if (match) {
      const value = match[1].trim().replace(/^["']|["']$/g, '');
      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY = value;
      return;
    }
    match = line.match(/^GEMINI_API_KEY=(.+)$/);
    if (match) {
      const value = match[1].trim().replace(/^["']|["']$/g, '');
      process.env.GEMINI_API_KEY = value;
      return;
    }
  });
}

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [...(appJson.expo.plugins || [])],
    extra: {
      ...appJson.expo.extra,
      anthropicApiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
      openrouterApiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '',
      geminiApiKey: process.env.GEMINI_API_KEY || '',
    },
  },
};
