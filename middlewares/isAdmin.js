const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        next();
    } else {
        return res.status(403).json({ message: 'Access denied. Admins only.'});
    }
}

module.exports = isAdmin;