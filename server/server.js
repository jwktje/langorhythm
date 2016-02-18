fs = Meteor.npmRequire('fs');
path = Meteor.npmRequire('path');
var MidiGen = Meteor.npmRequire('jsmidgen');

Meteor.tempDir = path.resolve(path.resolve('.'), "../.midifiles/");
Meteor.rootNote = 50;
var transpose = 0;
var bassTranspose = 0;
Meteor.scales = {
    pentatonic    :   function(){
        var scale = [Meteor.rootNote];
        var countReset = 1;
        var incrementSum = Meteor.rootNote;
        for(var x=1;x < 26;x++){
            //2 3 2 2 3
            var increment = 2;
            if(countReset == 2 || countReset == 5)
                increment = 3;
            incrementSum = incrementSum + increment;
            scale.push(incrementSum);
            if(countReset == 5) {
                countReset = 1;
            }
            else {
                countReset++;
            }
        }
        return scale;
    },
    major         :   function() {
        var scale = [Meteor.rootNote];
        var countReset = 1;
        var incrementSum = Meteor.rootNote;
        for (var x = 1; x < 26; x++) {
            //2 2 1 2 2 2 1
            var increment = 2;
            if (countReset == 3 || countReset == 7 )
                increment = 1;
            incrementSum = incrementSum + increment;
            scale.push(incrementSum);
            if (countReset == 7) {
                countReset = 1;
            }
            else {
                countReset++;
            }
        }
        return scale;
    },
    minor         :   function() {
        var scale = [Meteor.rootNote];
        var countReset = 1;
        var incrementSum = Meteor.rootNote;
        for (var x = 1; x < 26; x++) {
            //2 1 2 2 2 1 2
            var increment = 2;
            if (countReset == 2  || countReset == 6)
                increment = 1;
            incrementSum = incrementSum + increment;
            scale.push(incrementSum);
            if (countReset == 7) {
                countReset = 1;
            }
            else {
                countReset++;
            }
        }
        return scale;
    }
};
Meteor.chords = {
    pentatonic    :   [
        /*
        [33,45,61,64,68,73,76], //7
        [28,40,55,59,64,71,74], //M +2
        [31,43,59,62,66,71,74], //5
        [26,38,54,57,61,66,69], //root
        */
        [26,38,54,57,61,66,69], //7
        [21,33,48,52,57,64,67], //M +2
        [24,36,52,55,57,64,67], //5
        [19,31,47,50,54,59,62], //root
    ],
    major         :   [
        [23,35,50,54,59,62,66], //minor
        [26,38,54,57,62,66,69], //root
        [31,43,59,62,67,71,74], //5
        [33,45,61,64,69,73,76], //7
    ],
    minor         :   [
        [33,45,60,64,69,72,76], //7
        [26,38,53,57,62,65,69], //root
        [31,43,58,62,67,70,74], //5
        [26,38,53,57,62,65,69], //root
    ]
};

Meteor.methods({
    testMidiFile : function(filename,callback){
        if (!fs.existsSync(Meteor.tempDir)) {
            throw new Error(Meteor.tempDir + " does not exists");
        }

        //Generate midi file
        var file = new MidiGen.File();
        var track = new MidiGen.Track();
        file.addTrack(track);

        track.addNote(0, 50, 64, 100);
        track.addNote(0, 51, 64, 100);
        track.addNote(0, 53, 64, 100);
        track.addNote(0, 54, 64, 100);
        track.addNote(0, 55, 64, 100);
        track.addNote(0, 56, 64, 100);
        track.addNote(0, 57, 64, 100);
        track.addNote(0, 58, 64, 100);

        track.addNoteOn(0, 'c4', 64);
        track.addNoteOn(0, 'e4');
        track.addNoteOn(0, 'g4');
        track.addNoteOff(0, 'c4', 47);
        track.addNoteOff(0, 'e4');
        track.addNoteOff(0, 'g4');

        track.addNoteOn(0, 'c4', 1);
        track.addNoteOn(0, 'e4');
        track.addNoteOn(0, 'g4');
        track.addNoteOff(0, 'c4', 384);
        track.addNoteOff(0, 'e4');
        track.addNoteOff(0, 'g4');

        fs.writeFileSync(Meteor.tempDir+filename+'.mid', file.toBytes(), 'binary',function(){
            if(callback && typeof callback == "function") {
                callback(tempDir+'/'+filename+'.mid');
            }
        });
    },
    testScale : function(filename,callback){
        if (!fs.existsSync(Meteor.tempDir)) {
            throw new Error(Meteor.tempDir + " does not exists");
        }
        var scale = Meteor.scales.minor();
        //Generate midi file
        var file = new MidiGen.File();
        var track = new MidiGen.Track();
        file.addTrack(track);
        for(var x=0;x<scale.length;x++){
            track.addNote(0, scale[x], 32, 0);
        }
        fs.writeFileSync(Meteor.tempDir+filename+'.mid', file.toBytes(), 'binary',function(){
            if(callback && typeof callback == "function") {
                callback(tempDir+'/'+filename+'.mid');
            }
        });
    },
    generateMidiFile : function(filename,text,callback){
        if (!fs.existsSync(Meteor.tempDir)) {
            throw new Error(Meteor.tempDir + " does not exists");
        }
        //Generate midi file vars
        var file = new MidiGen.File();
        var track = new MidiGen.Track();
        var chordTrack = file.addTrack();
        file.addTrack(track);

        //echo separator
        console.log("\033[31m===============================\033[91m");
        //Initiate variables
        var processStartTime = new Date().getTime();
        var alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
        //Trailing whitespace
        var text = text.trim();
        if(text.slice(-1) !== ".")
            text += ".";
        var sentences = text.match( /[^\r\n\.,!\?]+[\r\n\,.!\?]+/g ) || [text];
        var textLength = text.replace(/(\r\n|\n|\r)/gm,"").length;
        var sentenceCount = sentences.length;
        var wordCount = text.split(" ").length;
        var avgWordLength = textLength / wordCount;
        var spacesAmount = (text.match(/\s/g) || []).length;
        var punctAmount = (text.match(/[^A-Z1-9\s]/gi) || []).length;
        var scale = "pentatonic";
        //console.log(text);
        //BPM
        var bpm = Math.round(
            (avgWordLength - Meteor.bpmRange.wordLow)
            / (Meteor.bpmRange.wordHigh-Meteor.bpmRange.wordLow)
            * (Meteor.bpmRange.tempoHigh - Meteor.bpmRange.tempoLow)
            + Meteor.bpmRange.tempoLow
        );
        track.setTempo(bpm);
        //Set the scale
        if((punctAmount + spacesAmount) %2 == 0) {
            //is even
            if(spacesAmount %2 == 1) {
                //is odd
                scale = "major";
            } else {
                scale = "minor";
            }
        }
       // scale = "minor";
        var loadedScale = Meteor.scales[scale]();
        var loadedChords = Meteor.chords[scale];

        //Countdown
        chordTrack.setTempo(bpm);
        chordTrack.addNote(3,25,128,0);
        chordTrack.addNote(3,25,128,0);
        chordTrack.addNote(3,25,128,0);
        chordTrack.addNote(3,25,128,0);
        chordTrack.addNote(3,25,128,0);
        chordTrack.addNote(3,25,128,0);
        chordTrack.addNote(3,25,128,0);
        chordTrack.addNote(3,25,128,0);
        //Start play
        chordTrack.addNote(5,127,64,0);
        //Vowel tracking functions
        var vowelTracking = {
            "a" : {
                count:0,

                multipliers : [
                    [[0,2]],
                    [[1,2]],
                ]
                /*
                multipliers : [
                    [[0,0]]
                ]
                */
            },
            "e" : {
                count:0,
                get multipliers () { return vowelTracking["a"].multipliers }
            },
            "i" : {
                count:0,
                get multipliers () { return vowelTracking["a"].multipliers }
            },
            "o" : {
                count:0,
                get multipliers () { return vowelTracking["a"].multipliers }
            },
            "u" : {
                count:0,
                get multipliers () { return vowelTracking["a"].multipliers }
            }
        };

        //Log stuff
        console.log(textLength+" characters and "+sentenceCount+" sentences");
        console.log(spacesAmount+" spaces!");
        console.log(punctAmount+" punctuations!");
        console.log(avgWordLength+" avgWordLength, making the BPM: "+bpm);
        console.log("scale: "+scale);
        //Process it
        //loop variables
        var sentenceCarryOverLength = 0;
        var handleCarryOverNow = false;
        var handledCarryOverThisLoop = false;
        var previousChord;
        var totalTickSum = 0;
        var lastNotePosition = 0;
        //First chord index is root.
        var chordIndex = 4;
        //Start the first chord
        var currentChord = loadedChords[(chordIndex-1)];
        for(var c1 = 0; c1 < currentChord.length; c1++) {
            track.addNoteOn(2, (currentChord[c1]+transpose),0,100);
            //Bassnotes
            if(c1==0){
                track.addNoteOn(1, ((currentChord[c1]+transpose)+bassTranspose),0,100);
            }
        }
        //console.log("Current chord: "+currentChord);
        previousChord = loadedChords[(chordIndex-1)];
        //Run the main loop
        for(var x = 0; x < sentences.length;x++){
            var sentenceNoNewline = sentences[x].replace(/(\r\n|\n|\r)/gm,"");
            var sentence = sentenceNoNewline.split(' ');
            if(sentence){
                var sentenceLength = sentenceNoNewline.length;
                chordIndex = sentenceLength % loadedChords.length;
                //For some reason "0" is almost never triggered.
                if(chordIndex == 0)
                    chordIndex = 1;
                else {
                    chordIndex = chordIndex + 1;
                }
                //console.log("upcoming sentence length: "+sentenceLength);
                var lastWordLength = 0;
                var lastWordPause = 0;
                var sentenceNoteObject = [];
                var vowelMultiplierList = [];
                for (var vowel in vowelTracking) {
                    vowelTracking[vowel].count = 0;
                }
                var sentenceLetterIndex = 0;
                for (var w = 0; w < sentence.length; w++) {
                    var word = sentence[w].match(/[A-Z]/gi);
                    if(word) {
                        //console.log("Upcoming wordlength = "+word.length);
                        for (var i = 0, len = word.length; i < len; i++) {
                            sentenceLetterIndex++;
                            //Build letter object
                            var letter = {};
                            letter.text = word[i];
                            letter.position = alphabet.indexOf(letter.text.toLowerCase());
                            letter.isVowel = vowelTracking.hasOwnProperty(letter.text.toLowerCase());
                            letter.pause = 0;
                            if(lastWordPause != 0) {
                                letter.pause = lastWordPause;
                                lastWordPause = 0;
                            }
                            //Process vowel multipliers
                            if(letter.isVowel) {
                                //If it is a vowel, add the multiplier rules to the list
                                var currentVowel = letter.text.toLowerCase();
                                var multiplierIndex = vowelTracking[currentVowel].count %
                                    vowelTracking[currentVowel]["multipliers"].length;
                                var currentMultiplierObject = vowelTracking[currentVowel]["multipliers"][multiplierIndex];
                                for(var c =0; c < currentMultiplierObject.length; c++) {
                                    var currentMultiplierAmount = currentMultiplierObject[c][1];
                                    var currentMultiplierOffset = currentMultiplierObject[c][0];
                                    var currentMultiplierPosition = sentenceLetterIndex + currentMultiplierOffset;
                                    if(vowelMultiplierList[currentMultiplierPosition]) {
                                        vowelMultiplierList[currentMultiplierPosition] *= currentMultiplierAmount;
                                    } else {
                                        vowelMultiplierList[currentMultiplierPosition] = currentMultiplierAmount;
                                    }
                                }
                                vowelTracking[currentVowel].count++;
                            }

                            //Log it
                            //console.log(letter);

                            // PROCESS SPACES
                            // Is this the last letter?
                            if( ( i + 1 ) == len ) {
                                // Don't handle spaces if it's the last word.
                                if( ( w + 1) != sentence.length) {
                                    //A space occurs
                                    //console.log("SPACE OCCURS! Last word length: "+lastWordLength);
                                    if(lastWordLength < 5) {
                                        //Last letter long and pause
                                        //Double length of last note entry and then pause for one count
                                        vowelMultiplierList[sentenceLetterIndex] *= 2;
                                        lastWordPause = 32;
                                    } else {
                                        //Pause one count
                                        lastWordPause = 32;
                                    }
                                }
                            }

                            //Check if interval isn't too big
                            var difference = function (a, b) { return Math.abs(a - b) };
                            var currentNotePosition = letter.position;
                            var currentDifference = difference(currentNotePosition,lastNotePosition);
                            if(currentDifference >= 17 ) {
                                if(currentDifference < 22) {
                                    //diff is between 8 and 15
                                    sentenceLetterIndex++;
                                    var averageNotePosition = Math.round( ( (currentNotePosition + lastNotePosition) / 2 ) );
                                    //console.log("small average note inserted: "+averageNotePosition);
                                    sentenceNoteObject.push({
                                        note: loadedScale[averageNotePosition]+transpose,
                                        pause: 0
                                    });
                                } else {
                                    //diff is 16 or higher
                                    sentenceLetterIndex += 2;
                                    var averageNoteMiddlePoint = Math.round( ( (currentNotePosition + lastNotePosition) / 2 ) );
                                    var firstOffset = Math.round( ( (lastNotePosition + averageNoteMiddlePoint) / 2 ) );
                                    var secondOffset = Math.round( ( (currentNotePosition + averageNoteMiddlePoint) / 2 ) );
                                    sentenceNoteObject.push({
                                        note: loadedScale[firstOffset]+transpose,
                                        pause: 0
                                    });
                                    //console.log("big average note inserted: "+firstOffset);
                                    sentenceNoteObject.push({
                                        note: loadedScale[secondOffset]+transpose,
                                        pause: 0
                                    });
                                    //console.log("big average note inserted: "+secondOffset);
                                }
                            }
                            lastNotePosition = currentNotePosition;

                            //Add letter to sentence Object
                            sentenceNoteObject.push({
                                note: loadedScale[letter.position]+transpose,
                                pause: letter.pause
                            });
                        }

                        //Set it at the end so the next loop will know this
                        lastWordLength = word.length;
                    }
                }
                //Calculate the note lenghts
                var sentenceTickSum = 0;

                for (var m = 0; m < sentenceNoteObject.length; m++) {
                    //Now do the actual calculation for the length
                    if(vowelMultiplierList[m]) {
                        sentenceNoteObject[m].duration = 32 * vowelMultiplierList[m];
                    } else {
                        sentenceNoteObject[m].duration = 32;
                    }
                    //console.log("calculated note");
                }
                //console.log("before adding loop");
                for (var n = 0; n < sentenceNoteObject.length; n++) {
                    //console.log("started adding loop");
                    if((sentenceCarryOverLength == 0 && x!=0 && handledCarryOverThisLoop == false) ||
                        (handleCarryOverNow === true && handledCarryOverThisLoop === false)) {
                        //console.log("stop/start chord with modulo :"+(totalTickSum % 512)+" and total of: "+totalTickSum);
                        //console.log("So starting a new chord on count: "+(totalTickSum/128))
                        //stop the previous chord
                        if(x!=0) {
                            for (var c2 = 0; c2 < previousChord.length; c2++) {
                                track.addNoteOff(2, (previousChord[c2] + transpose));
                                //Bassnotes
                                if(c2==0){
                                    track.addNoteOff(1, ((previousChord[c2]+transpose)+bassTranspose),0,100);
                                }
                            }
                        }
                        //Start the chord.
                        //console.log("chordIndex: "+chordIndex);
                        var currentChord = loadedChords[(chordIndex-1)];
                        for(var c1 = 0; c1 < currentChord.length; c1++) {
                            track.addNoteOn(2, (currentChord[c1]+transpose),0,100);
                            //Bassnotes
                            if(c1==0){
                                track.addNoteOn(1, ((currentChord[c1]+transpose)+bassTranspose),0,100);
                            }
                        }
                        //console.log("Current chord: "+currentChord);
                        previousChord = loadedChords[(chordIndex-1)];
                        handledCarryOverThisLoop = true;
                    } else {
                        if( x !=0 &&
                            sentenceCarryOverLength != 0 &&
                            ( (sentenceTickSum +
                            sentenceNoteObject[n].duration +
                            sentenceNoteObject[n].pause) >= sentenceCarryOverLength )
                            && handleCarryOverNow == false
                            && handledCarryOverThisLoop == false
                        ) {
                            //console.log("not the first sentence. And we should handle overflow or the overflow is 0");
                            //console.log("we notice this on note number: "+n);
                            //console.log("CarryOver Lenght: "+sentenceCarryOverLength);
                            //this means the next note is gonna overflow the bar. So fix the overflow
                            /*console.log("ticksum: "+sentenceTickSum);
                            console.log("carryover: "+sentenceCarryOverLength);
                            */
                            //console.log("old duration and pause: "+(sentenceNoteObject[n].duration + sentenceNoteObject[n].pause));
                            sentenceNoteObject[n].duration = (sentenceCarryOverLength - sentenceTickSum);
                            //Unset the pause to not leave trailing time at the end of a bar
                            sentenceNoteObject[n].pause = 0;
                            //console.log("new duration and pause: "+(sentenceNoteObject[n].duration + sentenceNoteObject[n].pause));
                            //Start beginning of chord on next loop
                            handleCarryOverNow = true;
                        }
                    }
                    track.addNote(0, sentenceNoteObject[n].note, sentenceNoteObject[n].duration, sentenceNoteObject[n].pause, 10);
                    sentenceTickSum += (sentenceNoteObject[n].duration + sentenceNoteObject[n].pause);
                    totalTickSum += (sentenceNoteObject[n].duration + sentenceNoteObject[n].pause);
                    //console.log("Sentence Tick Sum minus Carryover: "+(sentenceTickSum - sentenceCarryOverLength));
                    //console.log("added note");
                }
                //Set the next carryover to be the remainder of this sentence
                var sentenceTickSumAfterCarryOver = sentenceTickSum - sentenceCarryOverLength;
                //console.log("sentenceTickSumAfterCarryOver :"+sentenceTickSumAfterCarryOver);
                //If we handled carryover or if its the first sentence, we need to set carryover
                if(handledCarryOverThisLoop === true || x == 0) {
                    if(sentenceTickSumAfterCarryOver >= 512) {
                        if(sentenceTickSumAfterCarryOver == 512) {
                            sentenceCarryOverLength = 0;
                        } else {
                            sentenceCarryOverLength = 512 - (sentenceTickSumAfterCarryOver % 512);
                        }
                    } else {
                        sentenceCarryOverLength = 512 - sentenceTickSumAfterCarryOver;
                    }
                    handledCarryOverThisLoop = false;
                    handleCarryOverNow = false;
                } else {
                    //If not, we keep the trailing one
                    //console.log("trailing carryover");
                }
                //console.log("ended sentence "+x);
                //console.log("new carryover: "+sentenceCarryOverLength);
            }
        }
        //stop the last chord
        if(x!=0) {
            for (var c2 = 0; c2 < previousChord.length; c2++) {
                track.addNoteOff(2, (previousChord[c2] + transpose));
                //Bassnotes
                if(c2==0){
                    track.addNoteOff(1, ((previousChord[c2]+transpose)+bassTranspose),0,100);
                }
            }
        }
        var processEndTime = new Date().getTime();
        console.log('Processing done in ' + ( processEndTime - processStartTime ) + "ms");

        fs.writeFileSync(Meteor.tempDir+filename+'.mid', file.toBytes(), 'binary',function(){
            if(callback && typeof callback == "function") {
                callback(tempDir+'/'+filename+'.mid');
            }
        });

        //echo separator
        console.log("\033[31m===============================\033[91m");
    }
});


Meteor.startup(function () {
    //nothing
});
