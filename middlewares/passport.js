const passport = require('passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/users');

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: false, // Hier auf false setzen, wenn der Request nicht benötigt wird
};

passport.use(new Strategy(options, async (jwt_payload, done) => {
    try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false); // Kein Fehler, aber Benutzer nicht gefunden
        }
    } catch (error) {
        return done(error, false); // Fehler beim Finden des Benutzers
    }
}));

module.exports = passport;
