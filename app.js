//declare modules
var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var filename = path.join(__dirname, 'debug.log');
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({'timestamp':true}),
        new (winston.transports.File)({ filename: filename })
    ]
});
// Database
var PouchDB = require('pouchdb');
var db = new PouchDB('http://localhost:5984/trip');
//var db = new PouchDB('http://134.214.108.42:5984/trip');

var app = express();
var routes = require('./routes/index');

//set express environment
app.engine('.html', require('ejs').__express);
app.set('port', process.env.PORT || 8000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( {extended: false} ));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);
//app.use('/users', users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

//http server
var httpserver = http.createServer(app);
httpserver.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

//socket
var io = require('socket.io')(httpserver);
io.on('connection', function (socket) {
    socket.emit('news', {hello: 'world'});

//        io.emit send message to all clients，socket.emit send message to particular client
    socket.on('start',function(){
        logger.info('Experiment Starts!!!!');
    });
    socket.on('chooselocation', function (data) {
        logger.info('choose the location',data);
        var numLocation = data.location-1;
        io.emit('chooselocation', data);
    });

    socket.on('addnote', function(data){
        logger.info('add note',data);
        io.emit('addnote', data);
    });
    socket.on('deletenote', function(data){
        logger.info('delete note',data);
        io.emit('deletenote', data);
    });

    socket.on('vote', function(data){
        logger.info('vote for location',data);
        io.emit('vote', data);
    });

    socket.on('filtrateLocation', function(data){
        logger.info('filtrate location', data);
    });

    socket.on('touchLocationCard', function(data){
        logger.info('touch a location card', data);
    });

    socket.on('validation', function(data){
        logger.info('validation', data);
    });

    socket.on('changeZoom', function(){
        logger.info('change the zoom of the map');
    });

    socket.on('dragend', function(){
        logger.info('drag the map');
    });

    socket.on('end', function(){
        logger.info('Experiment Ends!!!!');
    });
});
