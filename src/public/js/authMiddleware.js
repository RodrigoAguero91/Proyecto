


const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/login');
    }
  };
  
  const isAdminOrPremium = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'premium')) {
      next();
    } else {
      res.status(403).json({ message: 'Acceso no autorizado.' });
    }
  };
  
  const hasAdminCredentials = (email, password) => {
    // Verificar si las credenciales coinciden con las del administrador
    return email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
  };
  
  export { isAuthenticated, isAdminOrPremium, hasAdminCredentials };