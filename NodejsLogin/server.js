var express			= require('express');
var bodyParser		= require('body-parser');
var cookieParser	= require('cookie-parser');
var session			= require('express-session');
var mongoose		= require('mongoose');
var passport		= require('passport');
var LocalStrategy	= require('passport-local').Strategy;
var passportLocalMongoose = require('passport-local-mongoose');

var app		= express();
var Schema	= mongoose.Schema;

// App config
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use(cookieParser());
	app.use(session({
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: false
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.static(__dirname + '/public'));
	app.set('views', __dirname + '/views');

// Passport config
	var AccountSchema = new Schema({
		username: String,
		password: String
	});

	AccountSchema.plugin(passportLocalMongoose);

	var Account = mongoose.model('Account', AccountSchema);
	passport.use(new LocalStrategy(Account.authenticate()));
	passport.serializeUser(Account.serializeUser());
	passport.deserializeUser(Account.deserializeUser());

// Mongoose config
	mongoose.connect('mongodb://localhost:27017/auth');

// Routes
	app.get('/', function (req, res) {
		res.render('index.twig', {
			user: req.user
		});
	});

	app.get('/register', function (req, res) {
		res.render('register.twig');
	});

	app.post('/register', function (req, res) {
		Account.register(new Account({ username: req.body.username }), req.body.password, function (err, account) {
			if (err) {
				return res.render('register', {
					account: account
				});
			}

			passport.authenticate('local')(req, res, function () {
				res.redirect('/');
			});
		});
	});

	app.get('/login', function (req, res) {
		res.render('login.twig', {
			user: req.user
		});
	});

	app.post('/login', passport.authenticate('local', { failureRedirect: '/login/fail' }), function (req, res) {
		if (req.isAuthenticated()) {
			if (req.body.remember) {
				// Cookie expires after 30 days
				req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
			} else {
				// Cookie expires at end of session
				req.session.cookie.expires = false;
			}

			res.redirect('/');
		} else {
			res.send('Korisnik nije autoriziran!');
		}
	});

	app.get('/login/fail', function (req, res) {
		res.status(401);
		res.send('Krivi username/password!');
	});

	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

// Start server
	app.listen(1337, function () {
		console.log('Server je pokrenut!\n');
	});