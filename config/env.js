/**
 * Validates required environment variables before the server starts.
 */
function validateEnv() {
  const missing = [];

  if (!process.env.MONGO_URI?.trim()) {
    missing.push('MONGO_URI');
  }
  if (!process.env.JWT_SECRET?.trim()) {
    missing.push('JWT_SECRET');
  }

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. See .env.example.`
    );
  }

  const weakSecrets = ['your-secret-key', 'changeme', 'secret'];
  if (
    process.env.NODE_ENV === 'production' &&
    weakSecrets.includes(process.env.JWT_SECRET.trim())
  ) {
    throw new Error(
      'JWT_SECRET must be a strong random value in production (not the example placeholder).'
    );
  }
}

module.exports = { validateEnv };
