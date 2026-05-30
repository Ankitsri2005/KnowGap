const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/knowgap';

const connectDB = async () => {
  const uris = [];

  if (process.env.MONGO_URI) uris.push(process.env.MONGO_URI);
  if (!uris.includes(LOCAL_URI)) uris.push(LOCAL_URI);

  for (const uri of uris) {
    try {
      await mongoose.connect(uri);
      const label = uri.includes('127.0.0.1') ? 'local MongoDB' : 'MongoDB Atlas';
      console.log(`${label} connected`);
      return;
    } catch (error) {
      console.error(`MongoDB failed (${uri.includes('127.0.0.1') ? 'local' : 'cloud'}):`, error.message);
    }
  }

  console.error('');
  console.error('No database connection. Install MongoDB locally or fix MONGO_URI in .env');
  console.error('Local example: MONGO_URI=mongodb://127.0.0.1:27017/knowgap');
  console.error('');
};

module.exports = connectDB;
