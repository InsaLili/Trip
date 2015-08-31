
// DOM Ready =============================================================
$(document).ready(function($){
    // Variables =============================================================
    var locationNumber;
    var groupNumber = 1;
    var playerNumber = 1;
    var allNotes = 0;
    var like = false;
    var red = '#D00000';

    var db = new PouchDB('http://localhost:5984/trip');
    var socket = io.connect('http://localhost:8000');

    // Functions =============================================================
    var Client = {
        init: function(){
            //set avatar src based on user's choice
            var imgSrc = ['img/player1.png','img/player2.png','img/player3.png'];
            $('#avatar img').attr('src',imgSrc[playerNumber-1]);

            //------------------hide arguments part
            $('#showAgu').hide();
            $('#addAgu').hide();

            //------------------click events for validation btns
            $('#submitNote').on('click', Client.addNote);
            $('#submitAgu').on('click', Client.addAgu);
            $("#heart").on('click', Client.addHeart);
            $('#avatar').on('click', function(){
                if (screenfull.enabled) {
                    screenfull.request();
                } else {
                    // Ignore or do something else
                }
            });

            $("#showNotes").on('click', '.deletenote', function(){
                Client.deleteNote(this.id);
            });
            Client.dialogInit();
            Client.serviceInit();
        },

        //------------------dialog initiation
        dialogInit: function(){
            $( '#chooseLocationDlg' ).dialog({
                autoOpen: false,
                height:200,
                modal: true,
                buttons:{
                    "OK": function(){
                        $(this).dialog("close");
                    }
                }
            });
            $( '#writeNoteDlg' ).dialog({
                autoOpen: false,
                height:200,
                modal: true,
                buttons:{
                    "OK": function(){
                        $(this).dialog("close");
                    }
                }
            });
        },

        serviceInit: function(){
            //------------------communication via server
            socket.on('choosegroup', function(data){
                console.log(data);
                groupNumber = data.group;
            });

            var addresses=['https://fr.wikipedia.org/wiki/Metropolitan_Museum_of_Art', 'https://fr.wikipedia.org/wiki/Central_Park','https://fr.wikipedia.org/wiki/Broadway','https://fr.wikipedia.org/wiki/Empire_State_Building'];

            socket.on('chooselocation', function (data) {
                var player = data.player;
                if(player == playerNumber) {
                    locationNumber = data.location;
                    Client.attachNote();
                    Client.attachVote();
                    document.getElementById("frame").src = addresses[locationNumber-1];
                }
            });
            socket.on('confirmlocation', function (data) {
                locationNumber = data.location;
                showInfoOnTable();
                $('#showAgu').show();
                $('#addAgu').show();
                $('#showNotes').hide();
                $('#addNotes').hide();
            });
        },

        attachNote: function(){
            $("#showNotes span").empty();

            //show notes of each player
            var startKey = 'note_'+groupNumber+'_'+locationNumber+'_'+playerNumber;
            db.allDocs({
                include_docs: true,
                attachements: true,
                startkey: startKey,
                endkey: startKey+'\uffff'
            }).then(function(notes){
                var noteContent = '';
                for(var i=0; i < notes.rows.length; i++){
                    var note = notes.rows[i].doc;
                    noteContent += '<div class = "noteOfPlayer">';
                    noteContent += '<p>'+note.content+'</p>';
                    noteContent += '<button id="'+note._id+'" class="btn btn-default btn-xs deletenote">'+'Effacer'+'</button>';
                    noteContent += '</div>';
                }
                $('#showNotes span').html(noteContent);
                Client.changeColor();
            });
        },

        attachVote: function(){
            var startKey = 'vote_'+groupNumber+'_'+locationNumber+'_'+playerNumber;
            var input = $('#input');

            db.allDocs({
                include_docs: true,
                attachements: true,
                startkey: startKey,
                endkey: startKey+'\uffff'
            }).then(function(vote){
                if(vote.rows.length !== 0){
                    var voteValue = vote.rows[0].doc.vote;
                    if(voteValue == true){
                        $('#heart').css('color', red);
                    }else{
                        $('#heart').css('color', 'grey');
                    }
                }else{
                    $('#heart').css('color', 'grey');
                }
            });
        },

        addNote: function(){
            event.preventDefault();

            if(!locationNumber){
                $('#chooseLocationDlg').dialog('open');
                return;
            }
            //if textarea is empty, return false
            var textarea = $('#myNote textarea');
            var text = textarea.val();
            if(!text){
                $('#writeNoteDlg').dialog('open');
                return;
            }

            var startKey = 'note_'+groupNumber+'_'+locationNumber+'_'+playerNumber;
            var noteNumber;
            db.allDocs({
                include_docs: true,
                attachements: true,
                startkey: startKey,
                endkey: startKey+'\uffff'
            }).then(function(notes){
            //如果之前已经有note，则noteNumber为之前最后一条note的number加1
            //如果没有，则noteNumber为1
                if(notes.rows.length !== 0){
                    noteNumber = notes.rows[notes.rows.length-1].doc.number+1;
                }else{
                    noteNumber = 1;
                }
                //the new id for new note
                var id = 'note_'+groupNumber+'_'+locationNumber+'_'+playerNumber+'_'+noteNumber;
                db.put({
                    _id: id,
                    "type": "note",
                    "group": groupNumber,
                    "location": locationNumber,
                    "author": playerNumber,
                    "number": noteNumber,
                    'content':text
                }).then(function(){
                    $('#showNotes span').append('<div class="noteOfPlayer">'+'<p>'+text+'</p>'+'<button id='+id+'  class="btn btn-default btn-xs deletenote">Effacer</button>'+'</div>');
                    Client.changeColor();
                    socket.emit('addnote', {id: id, content: text, location: locationNumber, player: playerNumber, notes: allNotes});
                });
            }).catch(function(err){
                console.log(err);
            });

            //clear text area
            textarea.val('');
        },

        addAgu: function(){
            event.preventDefault();

            if(!locationNumber){
                $('#chooseLocationDlg').dialog('open');
                return;
            }
            //if textarea is empty, return false
            var textarea = $('#myAgu textarea');
            var text = textarea.val();
            if(!text){
                $('#writeNoteDlg').dialog('open');
                return;
            }

            var startKey = 'agu_'+groupNumber+'_'+locationNumber+'_'+playerNumber;
            var aguNumber;
            db.allDocs({
                include_docs: true,
                attachements: true,
                startkey: startKey,
                endkey: startKey+'\uffff'
            }).then(function(agus){
            //如果之前已经有note，则noteNumber为之前最后一条note的number加1
            //如果没有，则noteNumber为1
                if(agus.rows.length !== 0){
                    aguNumber = agus.rows[agus.rows.length-1].doc.number+1;
                }else{
                    aguNumber = 1;
                }
                //the new id for new note
                var id = 'agu_'+groupNumber+'_'+locationNumber+'_'+playerNumber+'_'+aguNumber;
                db.put({
                    _id: id,
                    "type": "agu",
                    "group": groupNumber,
                    "location": locationNumber,
                    "author": playerNumber,
                    "number": aguNumber,
                    'content':text
                }).then(function(){
                    $('#showAgu span').append('<div class="aguOfPlayer">'+'<p>'+text+'</p>'+'<button id='+id+'  class="btn btn-default btn-xs" onclick="Client.deleteAgu(this.id)">Effacer</button>'+'</div>');
                    socket.emit('addagu', {id: id, content: text, location: locationNumber, player: playerNumber});
                });
            });
            //    clear textarea
            textarea.val('');
        },

        deleteNote: function(id){
            db.get(id).then(function(doc){
                return db.remove(doc);
            }).then(function(){
                $('#'+id).parent().remove();
                allNotes--;
                socket.emit('deletenote', {id: id, location: locationNumber, player: playerNumber, notes: allNotes});
            });
        },

        deleteAgu: function(id){
            db.get(id).then(function(doc){
                return db.remove(doc);
            }).then(function(){
                $('#'+id).parent().remove();
                socket.emit('deleteagu', {id: id, location: locationNumber, player: playerNumber});
            });
        },

        addHeart: function(){
            if(!locationNumber){
                $('#chooseLocationDlg').dialog('open');
                input.rating("update", 0);
                return;
            }
            var id = 'vote_' + groupNumber + '_' + locationNumber + '_' + playerNumber;
            if(like == false){
                $( '#heart' ).css('color', red);
                like = true;
                Client.updateVote(like, id);
            }else{
                $( '#heart' ).css('color', 'grey');
                like = false;
                Client.updateVote(like, id);
            }
        },

        updateVote: function(value, id){
            db.put({
                _id: id,
                "type": "vote",
                "group": groupNumber,
                "location": locationNumber,
                "player": playerNumber,
                "vote": value
            }).then(function() {
                socket.emit('vote', {location: locationNumber, group: groupNumber, player: playerNumber, value:value});
            }).catch(function(err){
                if(err.status == 409){
                    db.get(id).then(function(doc){
                        console.log(doc);
                        socket.emit('vote', {location: locationNumber, group: groupNumber, player: playerNumber, value:value});
                        return db.put({
                            _id: id,
                            _rev: doc._rev,
                            "type": "vote",
                            "group": groupNumber,
                            "location": locationNumber,
                            "player": playerNumber,
                            "vote": value
                        });
                    });
                }else{
                    console.log('other error');
                }
            });
        },

        changeColor: function(){
            var colors = [['#E0F2F1','#009688'], ['#F1F8E9','#8BC34A'], ['#FFF3E0','#FF9800']];
            $('#note p').css({'background-color': colors[playerNumber-1][0],'color': colors[playerNumber-1][1]});
        }
    };

    Client.init();
});

