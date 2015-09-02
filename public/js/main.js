/**
 * Created by Lili on 08/04/15.
 */
// DOM Ready =============================================================
$(document).ready(function() {
    $(document).on('contextmenu', function() {
        return false;
    });

//    var db = new PouchDB('http://134.214.198.102:5984/trip');
    var db = new PouchDB('http://localhost:5984/trip');
//    var socket = io.connect('http://134.214.198.102:8000');
    var socket = io.connect('http://localhost:8000');

    var map;

    var groupNumber = 1;
    var chosenNumber = 0;
    var aguFlag = false;
    var locationAmount = 23;
    var attractionAmount = 15;
    var hide=false;
    var filter = false;
    var markers = [];
    var locationNames = [
        'The Cloisters',
        'Central Park',
        'Broadway',
        'Empire State Building',
        'Museum of Modern Art',
        'New York skyline',
        'Statue of Liberty',
        'Fifth Avenue',
        'New York Public Library',
        'Times Square',
        'Top of the Rock',
        "St. Patrick's Cathedral",
        'Brooklyn',
        '9/11 Memorial',
        'Museum of Natural History',
        'Hotel Indigo - Chelsea', //hotel, place16
        'Harlem YMCA',
        'Herald Square Hotel',
        'Broadway Hotel',
        'Hilton Garden Inn',
        'Room Mate Grace',
        'DoubleTree',
        'New York Marriott Marquis'];
    var locationCoordinates = [
        [40.8648628,-73.9317274],
        [40.7828647,-73.9653551],
        [40.7818015,-73.9811689],
        [40.7484404,-73.9856554],
        [40.7614327,-73.9776216],
        [40.7015699,-74.0091314],
        [40.6892494,-74.0445004],
        [40.7318461,-73.9966758],
        [40.7531823,-73.9822534],
        [40.758895,-73.985131],
        [40.7592487,-73.9793369],
        [40.7584653,-73.9759927],
        [40.645244,-73.9449975],
        [40.7114998,-74.0132725],
        [40.7813241,-73.9739882],
        [40.746761,-73.991731],//place16
        [40.8147773,-73.9429932],
        [40.7889031,-73.9751046],
        [40.7979427,-73.9699991],
        [40.746876,-73.9823115],
        [40.7574278,-73.9838552],
        [40.756633,-73.971413],
        [40.758521,-73.98601]
    ];
    var red = '#D00000';
    var blue= '#1c94c4';

    var Server = {
        init: function () {
            Server.domInit();
            Server.mapInit();
            Server.dialogInit();
            Server.serviceInit();
            Server.attachNotes();
            Server.attachRating();
        },

        domInit: function(){

            for(var i=0; i<locationAmount; i++){
                var name = locationNames[i];
                var num = i+1;
                var leftOffset, topOffset;
                if(i<attractionAmount){
                    $('.locations').append('<div class="location attractions" id="location'+num+'"></div>');
                    leftOffset = i*90+100;
                    topOffset = 100;
                }else{
                    $('.locations').append('<div class="location hotels" id="location'+num+'"></div>');
                    leftOffset = (i-attractionAmount)*90+100;
                    topOffset = 600;
                }
                var $currentLocation = $('#location'+num);

                var title = '<div class="locationTitle"><h3>'+name+'</h3></div>';

                var visual = '<div class="visualPlayers"  id="visualLocation'+num+'"><h4>Visualisation :</h4><div class="visualPlayer visualPlayer1"><img src="img/player1.png"></div><div class="visualPlayer visualPlayer2"><img src="img/player2.png"></div><div class="visualPlayer visualPlayer3"><img src="img/player3.png"></div></div>';
                var choose = '<div class="chooseLocation"><h4>Choisir cet emplacement:</h4><button class="btn btn-default btn-md submitChoice" name='+name+' value='+num+'>Choisir</button></div>';
                var vote = '<span class="vote" id="vote'+num+'"><h4>Évaluation :</h4><div class="voteId"><img src="img/player1.png"></div><div class="voteId"><img src="img/player2.png"></div><div class="voteId"><img src="img/player3.png"></div><span class="glyphicon glyphicon-heart grey"></span><span class="glyphicon glyphicon-heart grey"></span><span class="glyphicon glyphicon-heart grey"></span></span>';
                var note = '<div class="note"><h4>Notes :</h4><span id="note1"></span></div>';
                var content = '<div class="locationContent">'+visual+choose+vote+note+'</div>';

                $currentLocation.append(title);
                $currentLocation.append(content);
                $currentLocation.offset({top: topOffset, left:leftOffset});
            }

            //------------------Enable multi-touch of location cards
            $('.location').touch();
            $('.chooseLocation').hide();
            $('.visualPlayer').hide();

            //off('click') insure the click only be detected once a time
            $('body').off('click').on('click', '.markerBtn', function(){
                Server.chooseLocation(this);
            });

            $('#filter span').on('click', Server.filtrateLocation);
            $('#hidebutton span').on('click',Server.hideLocation);
//            setTimeout(function(){
//
//            },)
        },

        //------------------Initialize each dialog
        dialogInit: function () {
            $("#start").dialog({
                resizable: false,
                width: 600,
                height: 420,
                modal: true,
                buttons: {
                    "Commencer": function () {
                        $(this).dialog("close");
                        //-------------------set the counter
                        $('#timer').countdown({
                            image: "/img/digits.png",
                            format: "mm:ss",
                            startTime: "20:00"
                        });
                    }
                }
            });
            $('#secondStepDialog').dialog({
                autoOpen: false,
                resizable: false,
                width: 600,
                height: 350,
                modal: true,
                buttons: {
                    "Commencer": function () {
                        $(this).dialog("close");
                        secondStep();
                    }
                }
            });

            $("#gameEnd").dialog({
                autoOpen: false,
                width: 600,
                height: 300,
                modal: true,
                buttons: {
                    "Commencer": function () {
                        $(this).dialog("close");
                        $('#timer3').countdown({
                            image: "/img/digits.png",
                            format: "mm:ss",
                            startTime: "07:00"
                        });
                    }
                }
            });

            $( "#choiceConfirm" ).dialog({
                autoOpen: false,
                width:500,
                height:200,
                modal: true,
                buttons: {
                    "Oui": function() {
                        $( this ).dialog( "close" );
                        confirmChoice(map);
                    },
                    "Non": function() {
                        $( this ).dialog( "close" );
                    }
                }
            });

        },

        //------realize the communication between pages
        serviceInit: function () {
            socket.on('addnote', function (data) {
                console.log(data);
                var id = data.id;
                var content = data.content;
                var player = data.player;
                var location = data.location;
                var notes = data.notes;
                $('#note' + location).append('<p id=' + id + ' class="notePlayer' + player + '">' + content + '</p>');
                var noteHeight = $('#location' + location + ' .note').height();
                if (noteHeight + 200 > 350) {
                    $('#location' + location).height(noteHeight + 200 + 'px');
                } else {
                    $('#location' + location).height(350 + 'px');
                }

            });

            socket.on('addagu', function (data) {
                console.log(data);
                var id = data.id;
                var content = data.content;
                var player = data.player;
                var location = parseInt(data.location);
                $('.arguments span').append('<p id=' + id + ' class="aguPlayer' + player + '">' + content + '</p>');
                var noteHeight = $('#location' + location + ' .note').height();
                var aguHeight = $('#location' + location + ' .arguments').height();
                $('#location' + location).height(noteHeight + aguHeight + 220 + 'px');
            });


            socket.on('deletenote', function (data) {
                console.log(data);
                var id = data.id;
                $('#' + id).remove();
                var location = data.location;
                var player = data.player;
                var notes = data.notes;
                var noteHeight = $('#location' + location + ' .note').height();
                if (noteHeight + 200 > 350) {
                    $('#location' + location).height(noteHeight + 200 + 'px');
                } else {
                    $('#location' + location).height(350 + 'px');
                }
            });

            socket.on('deleteagu', function (data) {
                console.log(data);
                var id = data.id;
                $('#' + id).remove();
                var location = data.location;
                var player = data.player;
                var noteHeight = $('#location' + location + ' .note').height();
                if (noteHeight + 200 > 350) {
                    $('#location' + location).height(noteHeight + 200 + 'px');
                } else {
                    $('#location' + location).height(350 + 'px');
                }
                var noteHeight = $('#location' + location + ' .note').height();
                var aguHeight = $('#location' + location + ' .arguments').height();
                $('#location' + location).height(noteHeight + aguHeight + 220 + 'px');
            });

            socket.on('vote', function (data) {
                var location = data.location;
                var player = data.player;
                var value = data.value;
                var hearts = $('#location' + location + ' span.glyphicon');
                if (value == true) {
                    $(hearts[player - 1]).css('color', red);
                } else {
                    $(hearts[player - 1]).css('color', 'grey');
                }
            });

        },

        mapInit: function () {

            var message = [];

            //        info in the pop-up window
            for(var i=0; i<locationAmount; i++){
                var num = i+1;
                var name = locationNames[i];
                message[i]= '<div id="marker'+num+'"><h3>'+name+'</h3><img class= "markerImg" src="/img/place'+num+'.jpg"><button type="button" class="btn player1 markerBtn" value="'+num+',1"><img src="/img/player1.png"></button><button type="button" class="btn player2 markerBtn" value="'+num+',2"><img src="/img/player2.png"></button><button type="button" class="btn player3 markerBtn" value="'+num+',3"><img src="/img/player3.png"></button></div>';
            }

            //    propoties of the map
            var mapProp = {
                center: new google.maps.LatLng(40.7504877,-73.9839238),
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            //    draw the map on DOM, which id is "googleMap"
            map = new google.maps.Map(document.getElementById("map"), mapProp);

            //      draw markers
            for (i = 0; i < locationAmount; i++) {
                var latitude = parseFloat(locationCoordinates[i][0]);
                var longitude = parseFloat(locationCoordinates[i][1]);
                var location = new google.maps.LatLng(latitude, longitude);
                var image;
                if(i<attractionAmount){
                    image = 'img/attraction.png'
                }else{
                    image = 'img/hotel.png'
                }
                var marker = new google.maps.Marker({
                    position: location,
                    icon: image
                });
                marker.setMap(map);
                var locationNum = i + 1;
                marker.metadata = {id: "location" + locationNum};
                marker.setTitle((i + 1).toString());
                markers.push(marker);
                Server.attachMessage(marker, i, message);
            }
        },

        attachMessage: function(marker, num, message) {
            var infowindow = new google.maps.InfoWindow({
                content: message[num],
                maxWidth: 320
            });

            google.maps.event.addListener(marker, 'click', function() {
                infowindow.open(marker.get('map'), marker);
            });
        },

        setMapOnAll: function(map){
            for(var i=0;i<locationAmount;i++){
                markers[i].setMap(map);
            }
        },

        //-----------------Add users' notes to the location cards
        attachNotes: function(){
            $('.location p').remove();
            var startKey = 'note_'+groupNumber;
            db.allDocs({
                include_docs: true,
                attachements: true,
                startkey: startKey+'_1',
                endkey: startKey+'_4\uffff'
            }).then(function(locationData){
                var note1 = 0;
                var note2 = 0;
                var note3 = 0;
                for(var i = 0; i < locationData.rows.length; i++){
                    var location = locationData.rows[i].doc.location;
                    var player = locationData.rows[i].doc.author;
                    var content = locationData.rows[i].doc.content;
                    var id = locationData.rows[i].doc._id;
                    switch (player){
                        case 1:
                            note1++;
                            break;
                        case 2:
                            note2++;
                            break;
                        case 3:
                            note3++;
                            break;
                    }
                    $('#note'+location).append('<p id='+id+' class="notePlayer'+player+'">'+content+'</p>');
                }
            });
        },

        //-----------------Add progression to the progress bar
        attachRating: function(){
            var startKey = 'vote_'+groupNumber;
            db.allDocs({
                include_docs: true,
                attachements: true,
                startkey: startKey,
                endkey: startKey+'\uffff'
            }).then(function(votes){
                for(var i = 0; i < votes.rows.length; i++) {
                    var player = votes.rows[i].doc.player;
                    var location = votes.rows[i].doc.location;
                    var value = votes.rows[i].doc.vote;
                    if(value == true){
                        var hearts = $('#vote'+location+' .glyphicon');
                        $(hearts[player-1]).css('color', red);
                    }
                }
            });
        },

        //-----------------Add rating results to location card
        filtrateLocation: function(){
            if(filter == false){
                Server.setMapOnAll(null);
                $( '#heart' ).css('color', red);
                filter = true;
                $('.location').hide();
                var startKey = 'vote_'+groupNumber;
                db.allDocs({
                    include_docs: true,
                    attachements: true,
                    startkey: startKey,
                    endkey: startKey+'\uffff'
                }).then(function(votes){
                    for(var i = 0; i < votes.rows.length; i++) {
                        var doc = votes.rows[i].doc;
                        if(doc.vote == true){
                            var location = doc.location;
                            $('#location'+location).show();
                            markers[location-1].setMap(map);
                        }
                    }
                });
            }else{
                Server.setMapOnAll(map);
                $( '#heart' ).css('color', 'grey');
                filter = false;
                if(hide==false){
                    $('.location').show();
                }else{
                    $('.location').hide();
                }
            }
        },

        hideLocation: function(){
            if(hide==false){
                $('.location').hide();
                $('#search').css('color', 'grey');
                hide = true;
            }else{
                $('.location').show();
                $('#search').css('color', blue);
                hide=false;
            }
        },

        chooseLocation: function(element){
            var buttonValue = element.value.split(',');
            console.log(buttonValue);
            var location = parseInt(buttonValue[0]);
            var player = parseInt(buttonValue[1]);
            socket.emit('chooselocation', { location: location, player: player, group: groupNumber, aguflag: aguFlag});

            $('.visualPlayer'+player).hide();
            $('div#visualLocation'+location+' .visualPlayer'+player).show();

            var className = element.className;
            var elements = document.getElementsByClassName(className);
            $(elements).css({'background-color': '#5bc0de', 'border-color': '#46b8da'});
            $(element).css({'background-color': '#f0ad4e', 'border-color': '#eea236'});
        }
    };

    Server.init();
});
