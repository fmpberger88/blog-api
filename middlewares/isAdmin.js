const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        next();
    } else {
        return res.status(403).send('Access denied. Admins only.');
    }
}

module.exports = isAdmin;