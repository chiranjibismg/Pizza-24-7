require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const ejs = require('ejs')
const expressLayout = require('express-ejs-layouts')
const initRoutes = require('./routes/web')
const PORT = process.env.PORT || 3000
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoDbStore = require('connect-mongo')
const passport = require('passport')

const Emitter = require('events')

//database connection

mongoose.connect(process.env.MONGO_CONNECTION_URL, {});
const connection = mongoose.connection;

connection.once('open', () => {
    console.log('Database connected...');
});

connection.on('error', (err) => {
    console.error('Connection error:', err.message);
});



//sesssion store
let mongoStore = MongoDbStore.create({
    mongoUrl: process.env.MONGO_CONNECTION_URL,
    collection: "sessions",
    // autoRemove: 'interval',     
    // autoRemoveInterval: 1 // In minutes. Default
})

const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)

// Session config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: mongoStore,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hour
}))


const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())


app.use(flash())


// Assets
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())


//global middleware
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})

//set template engine 
app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')


//routes
require('./routes/web') (app)







const server = app.listen(PORT , () => {
    console.log(`Listening on port ${PORT}`)
})



// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
          console.log(orderId) 
        socket.join(orderId)
      })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})