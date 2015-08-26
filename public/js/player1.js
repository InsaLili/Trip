
// DOM Ready =============================================================
$(document).ready(function($){
    // Variables =============================================================
    var locationNumber;
    var groupNumber = 1;
    var playerNumber = 1;
    var allNotes = 0;
    var like = false;

    var db = new PouchDB('http://localhost:5984/trip');
    var socket = io.connect('http://localhost:8000');

    // Functions =============================================================
    var Client = {
        init: function(){
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
            var addresses=["https://en.wikipedia.org/wiki/Eiffel_Tower", "http://www.booking.com/hotel/fr/warwickchampselysees.html?sid=746e6f5368654dfc131922d98d1031e2;dcid=1;checkin=2015-09-01;checkout=2015-09-02;dist=0;from_sav=1;group_adults=2;sb_price_type=total;srfid=71c6f9b682ac3255ccecf5c58ffc6925464b8ef4X2;type=total;ucfs=1&"];

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
                    input.rating('update', voteValue);
                    input.rating('refresh', {disabled: true});
                    $('#submitVote').prop('disabled', true);
                }else{
                    input.rating('update', 0);
                    input.rating('refresh', {disabled: false});
                    $('#submitVote').removeAttr('disabled');
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
                    allNotes++;
                    socket.emit('addnote', {id: id, content: text, location: locationNumber, player: playerNumber, notes: allNotes});
                });
            }).catch(function(err){
                console.log(err);
            });
            db.get('badge/'+groupNumber).then(function(doc){
                console.log(doc);
                var note1 = doc.note1;
                var note2 = doc.note2;
                var note3 = doc.note3;
                var timer = doc.timer;
                note1++;
                return db.put({
                    group: groupNumber,
                    note1: note1,
                    note2: note2,
                    note3: note3,
                    timer: timer
                }, 'badge/'+groupNumber, doc._rev);
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
                $( '#heart' ).css('color', 'red');
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
        }
    };

    Client.init();
});

