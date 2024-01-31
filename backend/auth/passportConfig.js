const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { User, Folder } = require("../database/models");
const admin = require("firebase-admin");

passport.serializeUser(function (user, done) {
    // console.log("Serializing User: ", user);
    done(null, user.id);
});

passport.deserializeUser(async function (user, done) {
    try {
        const loggedInUser = await User.findByPk(user);
        done(null, loggedInUser)
    } catch (error) {
        done(error, null);
    }
});

passport.use(new LocalStrategy(
    {
        passwordField: 'token'
    },
    async function (username, token, done) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            let user = await User.findOne({where: { uid: decodedToken.uid }});
            if (!user) {
                const firebaseUser = await admin.auth().getUser(decodedToken.uid);
                user = await User.create({
                    uid: decodedToken.uid,
                    displayname: firebaseUser.displayName,
                    profile_photo: firebaseUser.photoURL,
                    UserTierId: 1,
                    used_space: 0,
                });
                user.createFolder({
                    name: decodedToken.uid,
                    path: '/'
                });
            }
            return done(null, user)
        } catch (error) {
            console.log(error);
            return done(error)
        }
    }
))

module.exports = passport;