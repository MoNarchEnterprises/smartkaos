# SmartKaos.AI

SmartKaos.AI is an advanced AI voice agent platform that enables businesses to automate and enhance their customer communications through intelligent voice interactions.

## Features

- 🎙️ **AI Voice Agents**: Create and manage custom voice agents with unique personalities
- 📞 **Call Center**: Schedule, monitor, and analyze AI-powered calls
- 📊 **Analytics Dashboard**: Track performance metrics and call statistics
- 🔄 **Integrations**: Connect with CRM systems and calendar platforms
- 🔒 **Secure**: Enterprise-grade security with role-based access control

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Supabase account
- ElevenLabs API key
- Google Gemini API key

### Installation

1. Clone the repository:

   ```bash
   git clone [your-repository-url]
   cd smartkaos-ai
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

5. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

Required environment variables:

- `VITE_ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key

## Project Structure

```
smartkaos-ai/
├── docs/                    # Documentation files
├── src/
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API and service integrations
│   ├── store/             # State management
│   ├── types/             # TypeScript types
│   └── config/            # Configuration files
├── supabase/
│   └── migrations/        # Database migrations
└── public/                # Static assets
```

## Documentation

Detailed documentation is available in the `docs` folder:

- [Dashboard Guide](docs/01-Dashboard.md)
- [Voice Agents Guide](docs/02-Voice-Agents.md)
- [Call Center Guide](docs/03-Call-Center.md)
- [Settings Guide](docs/04-Settings.md)
- [Integrations Guide](docs/05-Integrations.md)

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Lint code

### Code Style

This project uses:

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

### Database Migrations

Database migrations are managed through Supabase and can be found in the `supabase/migrations` directory.

## Security

- All API keys should be kept secure and never committed to the repository
- Use environment variables for sensitive configuration
- Enable row-level security in Supabase
- Implement proper authentication and authorization

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is private and proprietary. All rights reserved.

## Support

For support, please contact info@pphc-llc.com.
