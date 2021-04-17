require('dotenv').config()
//express
const mongoose = require('mongoose');
const express = require('express')
const bodyParser= require('body-parser')
const MongoClient = require('mongodb').MongoClient
const basicAuth = require('express-basic-auth')
var methodOverride = require('method-override')
var morgan = require('morgan')
const session = require('express-session')
const path = require('path');
var MongoDBStore = require('connect-mongodb-session')(session);

// modules
const manageOrder = require('./pkg/manage-order')
const manageGroup = require('./pkg/manage-group')
const manageCron = require('./pkg/cron-jobs-node')
const manageSeo = require('./pkg/manage-seo')
const manageReferral = require('./pkg/manage-referral')

const app = express()

var connectionString = process.env.MONGODB_CONNECTION_STRING

mongoose.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

var store = new MongoDBStore({
    uri: connectionString,
    collection: 'userSessions'
  });

const sessionMiddleware = session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
    store: store
})
const basicAuthMiddleware = basicAuth({
    challenge: true,
    users: { [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASSWORD }
})

app.set('view engine', 'ejs')
app.set('trust proxy', 1 )
app.use(morgan('combined'))
app.use('/admin', basicAuthMiddleware)
app.use(express.static(path.join(__dirname, 'public')))
app.use(sessionMiddleware)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(bodyParser.urlencoded())
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

app.use(function(req,res,next){
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.locals.route = new URL(fullUrl)
    next()
})

// set the view engine to ejs
app.set('view engine', 'ejs');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
});
console.log('Connected to Database')

// load modules
app.use(manageOrder(db))
app.use(manageGroup(db))
app.use(manageCron(db))
app.use(manageSeo(db))
app.use(manageReferral(db)) // harus sebagai module terakhir
//Not found
app.use(function ( req, res, next) {
    res.render('pages/error404')
})
// error
app.use(function (error, req, res, next) {
    console.error(error.stack)
    res.status(error.status || 500)
    console.log({error})
    if (error.status === 404) {
        res.render('pages/error404')
    } else {
        res.render('pages/error500', {
            error
        })
    }
})

// listen on port
app.listen(3001, function() {
    console.log('listening on 3001')
})
