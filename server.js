const express = require("express");
const http = require('http');
const bodyParser = require('body-parser');
const passport = require('passport');
const authController = require('./passport_auth');
const authJwtController = require('./jwt');
db = require('./data')(); //global hack
var jwt = require('jsonwebtoken');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(passport.initialize());

var router = express.Router();

function getBadRouteJSON(req, res, route) {
    res.json({success: false, msg: req.method + " requests are not supported by " + route});
}

function getJSONObject(req) {
    var json = {
        headers: "No Headers",
        key: process.env.UNIQUE_KEY,
        body: "No Body"
    };

    if (req.body != null) {
        json.body = req.body;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

function getMoviesJSONObject(req, msg) {
    var json = {
        status: 200,
        message: msg,
        headers: "No Headers",
        query: "No Query String",
        env: process.env.UNIQUE_KEY
    };

    if (req.query != null) {
        json.query = req.query;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }
    return json;
}

router.route('/post')
    .post(authController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            var o = getJSONObject(req);
            res.json(o);
        }
    );

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/signup')
    .post(function (req, res) {
        if (!req.body.username || !req.body.password) {
            res.json({success: false, msg: 'Please pass username and password.'});
        } else {
            var newUser = {
                username: req.body.username,
                password: req.body.password
            };
            // save the user
            db.save(newUser); //no duplicate checking
            res.json({success: true, msg: 'Successful created new user.'});
        }
    })
    .all(function (req, res) {
        getBadRouteJSON(req, res, "/signup");
    });

router.route('/signin')
    .post(function (req, res) {
        var user;

        user = db.findOne(req.body.username);

        if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
            // check if password matches
            if (req.body.password === user.password) {
                var userToken = {id: user.id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            } else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        }
    });

router.route('/movies')
    .get(
        function (req, res) {
            res.json(getMoviesJSONObject(req, "GET movies"));
        })
    .post(
        function (req, res) {
            res.json(getMoviesJSONObject(req, "movie saved"));
        })
    .put(
        authJwtController.isAuthenticated,
        function (req, res) {
            res.json(getMoviesJSONObject(req, "movie updated"));
        })
    .delete(
        authController.isAuthenticated,
        function (req, res) {
            res.json(getMoviesJSONObject(req, "movie deleted"));
        });
    

app.use('/', router);
app.use(function (req, res) {
    getBadRouteJSON(req, res, "this URL path");
});
app.listen(process.env.PORT || 8080);


