const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require("passport");
const mongoose = require('mongoose');
const redisClient = require('./redis.js')
const cloud = require('./cloudstorage/storage.js');
const multer = require('multer')
const { promisify } = require('util');
const cors = require('cors');
const {validate: uuidValidate} = require('uuid');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// AUTH DB Config
const db = require('./config/keys').mongoURI;

// Connect to MongoDB Atlas
mongoose
    .connect(
        db,
        { useNewUrlParser: true }
    )
    .then(() => console.log("Successfully connected to MongoDB Atlas"))
    .catch(err => console.log(err));

//connected to Redis instance
redisClient.on("connect", function () {
    console.log("Redis: connected!");
});

// async function for setting key,value pair in cache
const setCacheAysnc = promisify(redisClient.set).bind(redisClient);
// async function for getting key,value pair from cache
const getCacheAsync = promisify(redisClient.get).bind(redisClient);
/* usage above functions
await setAsync('foo', 'bar');
const fooValue = await getAsync('foo');
--> second example
getCacheAsync.then(console.log).catch(console.error);
*/

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Passport middleware
app.use(passport.initialize());

// Passport config
require("./config/passport")(passport);

app.use(cors());

app.use('/', indexRouter);
app.use('/api/users', usersRouter);



app.get('/images',passport.authenticate('jwt', { session: false }), (req, res) => {
  let query = req.query.toString();
  let list = [];
  let links = [];

  if (query == undefined){
    cloud.listAllFiles(req.user.readBucket, list);
    if (list) {
      list.forEach ( function(element) {
        var t = "";
        var temp = await getCacheAsync(element);
        if (temp !== 'nil') {
          links.push(temp);
          console.log("Redis: link found");
        }
        else {
          cloud.getSignedUrl(req.user.readBucket,element,t);
          cloud.getSignedUrl().catch(console.error);
          links.push(t);
          var g = await setCacheAysnc(element, t);
          console.log("Redis: new link stored");
        }
      });
      console.log('Fetched images from bucket ${req.user.readBucket}');
      res.status(200).send(JSON.stringify(links));
    }
    else {
      console.log('Could not fetch images from bucket ${req.user.readBucket}');
      res.sendStatus(404);
    }
  }
  else {
      let result = uuidValidate(query);
      let templink = "";
      if (result){
        var a = await getCacheAsync(query);
        if (a == 'nil'){
          cloud.getSignedUrl(req.user.readBucket, query, tempLink);
          links.push(tempLink);
          var u = await setCacheAysnc(query,tempLink);
          console.log("Redis: new link stored");
        }
        else {
          console.log('Redis: link found');
          links.push(a);
        }
      res.status(200).send(JSON.stringify(links));
      }
      else {
        //couldn't find link due to invalid query/ resource not found
        res.sendStatus(404);
      }
  }
  links.splice(0,links.length);
  list.splice(0,list.length);

});

app.post('/images',passport.authenticate('jwt', { session: false }), (req, res) => {


});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
