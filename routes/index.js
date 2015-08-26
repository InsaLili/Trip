/**
 * Created by mac on 09/04/15.
 */
/* GET Userlist page. */

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Map' });
});

router.get('/lycee', function(req, res) {
    res.render('lycee', { title: 'Map' });
});

router.get('/player1', function(req, res){
    res.render('player1', {});
});

router.get('/player2', function(req, res){
    res.render('player2', {});
});

router.get('/player3', function(req, res){
    res.render('player3', {});
});

router.get('/presentation', function(req, res){
    res.render('presentation', {});
});
router.get('/upload', function(req, res){
    fetchData(req.query);
});



module.exports = router;

