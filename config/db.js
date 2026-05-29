const mongoose = require('mongoose');

const LOCAL_MONGO_URI = 'mongodb://127.0.0.1:27017/knowgap';

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  let uri = process.env.MONGO_URI?.trim();

  if (!uri) {
    if (isProduction) {
      console.error(
        'MONGO_URI is not set. Add it in Render → Environment (MongoDB Atlas connection string).'
      );
      process.exit(1);
    }

    uri = LOCAL_MONGO_URI;
    console.warn(`MONGO_URI not set — trying local MongoDB at ${LOCAL_MONGO_URI}`);
    console.warn('Tip: copy MONGO_URI from Render → Environment into your .env file.');
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    if (!isProduction) {
      console.error('\nFix locally:');
      console.error('  • Add MONGO_URI to .env (same value as on Render), or');
      console.error('  • Install MongoDB Community: https://www.mongodb.com/try/download/community');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
