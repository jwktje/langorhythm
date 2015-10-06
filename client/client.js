var theFile, outputs;
var theOutput;

function playMidiFile(buffer){
    // creating the MidiFile instance from a buffer (view MIDIFile README)
    var midiFile = new MIDIFile(buffer);
    // Loading the midiFile instance in the player
    midiPlayer.load(midiFile);
    //Volume
    midiPlayer.volume = 100;
    // Playing
    console.log('Play started');
    midiPlayer.play(function() {
        console.log('Play ended');
    });
    /*
    // Pausing
    midiPlayer.pause();

    // Resuming
    midiPlayer.resume();

    // Stopping
    midiPlayer.stop();

    // Playing again and loop
    midiPlayer.play(function playCallback() {
        midiPlayer.play(playCallback);
    });
    */

}
Template.test.events({
    "change form#outputs" : function(){
        var selIdx = $("form#outputs select").val();
        console.log("output is:"+selIdx);
        //midi.setMidiOutputToPort(selIdx, 0);
    },
    "click #gettempo" : function() {
        var txtInput = $("#text textarea").val();
        var textLength = txtInput.replace(/(\r\n|\n|\r)/gm,"").length;
        var wordCount = txtInput.split(" ").length;
        var avgWordLength = textLength / wordCount;
        var bpm = Math.round(
            (avgWordLength - Meteor.bpmRange.wordLow)
            / (Meteor.bpmRange.wordHigh-Meteor.bpmRange.wordLow)
            * (Meteor.bpmRange.tempoHigh - Meteor.bpmRange.tempoLow)
            + Meteor.bpmRange.tempoLow
        );
        $("#bpm").val(bpm);
    },
    "click #play"   : function(){
        var txtInput = $("#text textarea").val();
        //console.log(txtInput);
        var bufferFileName = "genBuffer";
        Meteor.call('generateMidiFile',bufferFileName,txtInput,function() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'http://localhost:3000/midi/'+bufferFileName+'.mid', true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function(e) {
                if (this.status == 200) {
                    var response = this.response;
                    playMidiFile(response);
                }
            };
            xhr.send();
        });
    },
    "click #speech" : function() {
        $("#text textarea").val("");
        var recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        //recognition.lang = "nl_NL";
        var fullText = '';
        recognition.onresult = function(event) {
            var theText = '';
            for (var i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    var textIsFinal = event.results[i][0].transcript.trim();
                    if(textIsFinal.toLowerCase() == "turn this into music") {
                        $("#text textarea").val(fullText);
                        recognition.stop();
                        $("#play").trigger("click");
                    } else {
                        fullText += textIsFinal+".\n";
                        $("#text textarea").val(fullText);
                    }
                } else {
                    theText += event.results[i][0].transcript;
                    $("#text textarea").val(fullText+theText);
                }
            }
        };
        recognition.start();
    }
});
Template.test.onRendered(function(){
    console.log("rendered");
    navigator.requestMIDIAccess({sysex: true}).then(function(midiAccess) {
        console.log("Got midi access");
        // Creating player
        var outputIterator = midiAccess.outputs.values();
        outputs = [];
        for (var o = outputIterator.next(); !o.done; o = outputIterator.next()) {
            outputs.push(o.value);
        }
        console.log(outputs.length+" outputs");
        theOutput = midiAccess.outputs.get(outputs[0]["id"]);
        midiPlayer = new MIDIPlayer({
            'output':theOutput
        });
        console.log(midiAccess.outputs.get(outputs[0]["id"]));
        for(var i=0; i<outputs.length; i++) {
            var option = '<option value="'+i+'">'+outputs[i]["name"]+' : '+outputs[i]["id"]+'</option>';
            $("form#outputs select").append(option);
        }
        //Test note
        var noteOnMessage = [0x90, 60, 0x7f];// note on, middle C, full velocity
        theOutput.send( noteOnMessage );  //omitting the timestamp means send immediately.
        theOutput.send( [0x80, 60, 0x40], window.performance.now() + 1000.0 );
    }, function() {
        console.log('No midi output');
    });
});


Meteor.test = function(){
    var testFilename = "theTest";
    //var method = "testMidiFile";
    var method = "testScale";
    Meteor.call(method,testFilename,function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://localhost:3000/midi/'+testFilename+'.mid', true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(e) {
            if (this.status == 200) {
                var response = this.response;
                playMidiFile(response);
            }
        };
        xhr.send();
    });
};