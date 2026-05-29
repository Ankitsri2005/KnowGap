const mongoose = require('mongoose');

const connectDB = async () => {

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error(
      'MONGO_URI is not set. Add it in Render → Environment (MongoDB Atlas connection string).'
    );
    process.exit(1);
  }

  try {

    await mongoose.connect(uri);

    console.log('MongoDB Connected');

  } catch (error) {

    console.error(error.message);

    process.exit(1);
  }
};

module.exports = connectDB;