/**
 * Created by Lili on 08/04/15.
 */
// DOM Ready =============================================================
$(document).ready(function() {
    $(document).on('contextmenu', function() {
        return false;
    });

    var db = new PouchDB('http://localhost:5984/trip');
    var socket = io.connect('http://localhost:8000');

    var groupNumber = 1;
    var chosenNumber = 0;
    var aguFlag = false;
    var locationAmount = 4;
    var locationNames = ['Location 1', '2', '3', '4'];

    var red = '#D00000';

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
                $('.locations').append('<div class="location" id="location'+num+'"></div>');
                var $currentLocation = $('#location'+num);

                var title = '<div class="locationTitle"><h3>'+name+'</h3></div>';

                var visual = '<div class="visualPlayers"  id="visualLocation'+num+'"><h4>Visualisation :</h4><div class="visualPlayer visualPlayer1"><img src="img/player1.png"></div><div class="visualPlayer visualPlayer2"><img src="img/player2.png"></div><div class="visualPlayer visualPlayer3"><img src="img/player3.png"></div></div>';
                var choose = '<div class="chooseLocation"><h4>Choisir cet emplacement:</h4><button class="btn btn-default btn-md submitChoice" name='+name+' value='+num+'>Choisir</button></div>';
                var vote = '<span class="vote" id="vote'+num+'"><h4>Évaluation :</h4><div class="voteId"><img src="img/player1.png"></div><div class="voteId"><img src="img/player2.png"></div><div class="voteId"><img src="img/player3.png"></div><span class="glyphicon glyphicon-heart grey"></span><span class="glyphicon glyphicon-heart grey"></span><span class="glyphicon glyphicon-heart grey"></span></span>';
                var note = '<div class="note"><h4>Notes :</h4><span id="note1"></span></div>';
                var content = '<div class="locationContent">'+visual+choose+vote+note+'</div>';

                $currentLocation.append(title);
                $currentLocation.append(content);

                //------------------Enable multi-touch of location cards
                $('.location').touch();
                $('.chooseLocation').hide();
                $('.visualPlayer').hide();

                //off('click') insure the click only be detected once a time
                $('body').off('click').on('click', '.markerBtn', function(){
                    Server.chooseLocation(this);
                });
            }
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
            //    eight locations' coordinates
            var locations = [
                [48.8583701, 2.2944813],
                [48.8737917, 2.2950275],
                [48.8606111, 2.337644],
                [48.8529682, 2.3499021],
            ];
            var message = [];

            //        info in the pop-up window
            for(var i=0; i<locationAmount; i++){
                var num = i+1;
                var name = locationNames[i];
                message[i]= '<div id="marker'+num+'"><h3>'+name+'</h3><img class= "markerImg" src="/img/place'+num+'.jpg"><button type="button" class="btn player1 markerBtn" value="'+num+',1"><img src="/img/player1.png"></button><button type="button" class="btn player2 markerBtn" value="'+num+',2"><img src="/img/player2.png"></button><button type="button" class="btn player3 markerBtn" value="'+num+',3"><img src="/img/player3.png"></button></div>';
            }

            var markers = [];
            //    propoties of the map
            var mapProp = {
                center: new google.maps.LatLng(48.8588589, 2.3470599),
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            //    draw the map on DOM, which id is "googleMap"
            var map = new google.maps.Map(document.getElementById("map"), mapProp);

            //      draw markers
            for (i = 0; i < locations.length; i++) {
                var latitude = parseFloat(locations[i][0]);
                var longitude = parseFloat(locations[i][1]);
                var location = new google.maps.LatLng(latitude, longitude);
                var marker = new google.maps.Marker({
                    position: location
                });
                marker.setMap(map);
                var locationNum = i + 1;
                marker.metadata = {id: "location" + locationNum};
                //        marker.metadata.id = "location1";
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
                startkey: startKey+'_1',
                endkey: startKey+'_4\uffff'
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
        attachVotes: function(event){
        var startKey = 'vote_'+groupNumber;
            db.allDocs({
                include_docs: true,
                attachements: true,
                startkey: startKey,
                endkey: startKey+'\uffff'
            }).then(function(votes){
                var allVotes = [0,0,0,0,0,0,0,0], voteAvg = [0,0,0,0,0,0,0,0];
                for(var i = 0; i < votes.rows.length; i++) {
                    var location = parseInt(votes.rows[i].doc.location);
                    allVotes[location-1] += parseInt(votes.rows[i].doc.vote);
                }
                voteAvg[0] = Math.round(allVotes[0]/3);
                voteAvg[1] = Math.round(allVotes[1]/3);
                voteAvg[2] = Math.round(allVotes[2]/3);
                voteAvg[3] = Math.round(allVotes[3]/3);
                voteAvg[4] = Math.round(allVotes[4]/3);
                voteAvg[5] = Math.round(allVotes[5]/3);
                voteAvg[6] = Math.round(allVotes[6]/3);
                voteAvg[7] = Math.round(allVotes[7]/3);
                $('#input1').rating('update', voteAvg[0]);
                $('#input2').rating('update', voteAvg[1]);
                $('#input3').rating('update', voteAvg[2]);
                $('#input4').rating('update', voteAvg[3]);
                $('#input5').rating('update', voteAvg[4]);
                $('#input6').rating('update', voteAvg[5]);
                $('#input7').rating('update', voteAvg[6]);
                $('#input8').rating('update', voteAvg[7]);
            });
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
        },

        confirmChoice: function(){
            $('#step1').css('color', '#616161');
            $('#step2').css('color', '#616161');
            $('#step3').css('color', '#E0E0E0');
            $('#finalStepBtn').removeAttr('disabled');
            aguFlag = true;

            socket.emit('confirmlocation', { location: chosenNumber});
            $('#school').prop('disabled', true);
            $('#mountain').prop('disabled', true);
            $('.mountainLocations').show();
            $('.schoolLocations').show();
            $('.location').hide();
            $('#location'+chosenNumber).show();
            $('.chooseLocation').hide();
            $('.visualPlayers').show();
//-----------------------to be improved
            socket.emit('chooselocation', { location: chosenNumber, player: 1, group: groupNumber});
            socket.emit('chooselocation', { location: chosenNumber, player: 2, group: groupNumber});
            socket.emit('chooselocation', { location: chosenNumber, player: 3, group: groupNumber});

//---------------------Final dialog
            var locationName = $('#location'+chosenNumber+' button').attr('name');
            $('#gameEnd h4').first().text("Vous avez choisi l'emplacement '"+locationName+"' .");
            $('#gameEnd').dialog('open');

//--------------------add "Argumentaire" part onto the card
            var noteHeight = $('#location'+chosenNumber+' .note').height();

            var txt = '<div class="arguments">';
            txt += '<h4>Argumentaire :</h4>';
            txt += '<span></span>';
            txt += '</div>';
            $('#location'+chosenNumber+' .note').after(txt);
            var aguHeight = noteHeight + 180;
            $('.arguments').css({'margin-top':aguHeight + 'px'});
            $('#location'+chosenNumber).height(noteHeight + 300 +'px');


            db.get('decision/'+groupNumber).then(function(doc) {
                console.log("chosenNumber = "+chosenNumber);
                return db.put({
                    group: groupNumber,
                    location: chosenNumber,
                }, 'decision/'+groupNumber, doc._rev);
            });
        },

        resetLocation: function(){
            if($('.mountainLocations').css('display') !== "none"){
                var $mountain = $('.mountainLocations .location');
                $mountain.touch();
                $mountain.css({'-webkit-transform' : 'rotate(0deg)',
                    '-moz-transform' : 'rotate(0deg)',
                    '-ms-transform' : 'rotate(0deg)',
                    'transform' : 'rotate(0deg)'});
            }

            if($('.schoolLocations').css('display') !== "none"){
                var $school = $('.schoolLocations .location');
                $school.touch();
                $school.css({'-webkit-transform' : 'rotate(0deg)',
                    '-moz-transform' : 'rotate(0deg)',
                    '-ms-transform' : 'rotate(0deg)',
                    'transform' : 'rotate(0deg)'});
            }
        }
    };

    Server.init();
});
