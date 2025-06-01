import jwt from 'jsonwebtoken';

const authUser = (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Invalid token payload',
      });
    }

    // Attach user ID to the request object for future use
    req.user = { id: decoded.id };
    next();

  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({
      success: false,
      message: 'Token verification failed',
    });
  }
};

export default authUser;
