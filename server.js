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
    .get(authJwtController.isAuthenticated,function(req,res)
    {
        if(true)
        {
            Movie.find({},function(err,movies)
            {
                if(err){res.send(err);}
                res.json({Movie:movies});
            })
            
        }
    })


    .post(authJwtController.isAuthenticated,function(req,res)
    {
        if(!req.body.title|| !req.body.year|| !req.body.Genre|| !req.body.Actors && !req.body.Actors.length)
        {
            res.json({success:false,msg:'Provide movie title, the Year the Movie Released, the Genre, and Actors(Character they Played and Actors real name)'});

        }
        else
        {
            if(req.body.Actors.length < 3)
            {
                res.json({success:false,msg:'Make sure there are a minimum of 3 Actors.'});
            }
            else
            {
                var movie = new Movie(req,res);
                movie.title = req.body.title;
                movie.year = req.body.year;
                movie.Genre = req.body.Genre;
                movie.Actors = req.body.Actors;
                
                movie.save(function(error)
                {
                    if (err)
                    {
                        if(error.code==11000)
                            return res.json({success:false,msg:'Movie Title Already exists in DB'});
                        else
                            return res.send(error);
                    }

                    res.json({msg:'Movie has been created'});

                });

            }
        
        }




    })


    .put(authJwtController.isAuthenticated,function(req,res)
    {
        var  id = req.headers.id;
        Movie.findOne({_id:id}).exec(function(error,movie)
        {  
            if(err) res.send(err);
            movie.title = req.body.title;
            movie.year = req.body.year;
            movie.Genre = req.body.Genre;
            movie.Actors = req.body.Actors;
            
            movie.save(function(err)
            {
                if (err)
                    {
                        if(error.code==11000)
                            return res.json({success:false,msg:'Movie Title Already exists in DB'});
                        else
                            return res.send(error);
                    }

                    res.json({msg:'Movie has been created'});



            });




        });



    })




    .delete(authJwtController.isAuthenticated, function (req, res)
    {
        if(!req.body.title)
        {
            return res.json({success:false,msg:'Need a valid movie title'});
        }
        
        else
        {
            Movie.findOne({title: req.body.title}).exec(function(err,result)
            {
                if(req !== null)
                {
                    Movie.remove({title: req.body.title}).exec(function(err)
                    {
                        if (err) res.json({success:false,msg: req.body.title+' is not found'});
                        else res.json({success:true,msg:'Movie has been deleted'});


                    })

                }




            });



        }





    });
    

app.use('/', router);
app.use(function (req, res) {
    getBadRouteJSON(req, res, "this URL path");
});
app.listen(process.env.PORT || 8080);


