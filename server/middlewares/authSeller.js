import jwt from 'jsonwebtoken';

const authSeller = (req, res, next) => {
  const { sellerToken } = req.cookies;

  if (!sellerToken) {
    return res.status(401).json({ success: false, message: 'Not Authorized: No token' });
  }

  try {
    const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);

    if (tokenDecode.email !== process.env.SELLER_EMAIL) {
      return res.status(401).json({ success: false, message: 'Not Authorized: Invalid token' });
    }

    // Optionally attach seller info to req
    req.seller = { email: tokenDecode.email };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token verification failed' });
  }
};

export default authSeller;
