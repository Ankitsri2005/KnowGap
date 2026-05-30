const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {

    res.status(401).json({
      error: 'Invalid token'
    });
  }
};

const teacherOnly = (req, res, next) => {

  if (req.user.role !== 'teacher') {
    return res.status(403).json({
      error: 'Teachers only'
    });
  }

  next();
};

module.exports = {
  auth,
  teacherOnly
};