const mongoose = require('mongoose');

const connectOptions = {
  serverSelectionTimeoutMS: 10000,
};

/** Avoid SRV DNS lookups when mongodb+srv fails (common on some Windows networks). */
function toDirectMongoUri(uri) {
  if (!uri.startsWith('mongodb+srv://')) {
    return null;
  }

  const direct = uri.replace(
    'mongodb+srv://',
    'mongodb://'
  );

  const separator = direct.includes('?') ? '&' : '?';
  if (/[?&]ssl=/i.test(direct)) {
    return direct;
  }

  return `${direct}${separator}tls=true`;
}

async function tryConnect(uri) {
  await mongoose.connect(uri, connectOptions);
}

const connectDB = async () => {

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      'MONGO_URI is missing. Add it to your .env file (see .env.example).'
    );
  }

  try {
    await tryConnect(uri);
  } catch (error) {
    const directUri = toDirectMongoUri(uri);
    const srvDnsFailed = /querySrv\s+ECONNREFUSED/i.test(
      error.message
    );

    if (directUri && srvDnsFailed) {
      console.warn(
        'SRV lookup failed; retrying with a direct mongodb:// URI...'
      );
      await tryConnect(directUri);
    } else {
      throw error;
    }
  }

  console.log('MongoDB Connected');
};

module.exports = connectDB;