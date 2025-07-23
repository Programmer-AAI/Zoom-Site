const authMiddleware = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  res.redirect('/admin');
};

module.exports = authMiddleware;