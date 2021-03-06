const fs = require('fs');
const cpFile = require('cp-file');
const mkdirp = require('mkdirp');
const path = require('path');
const { default: SlippiGame } = require('@slippi/slippi-js');


class Parse {
    constructor(path) {
        this.game = new SlippiGame(path);
        this.settings = this.game.getSettings();
        this.frames = this.game.getFrames();
        this.stats = this.game.getStats();
    }

    isValid() {
        return (this.settings &&
                this.settings.players[this.settings.players.length-1].startStocks == 4 &&
                this.settings.players.length == 2 &&
                this.settings.isTeams == false);
    }

    checkStage(stage) {
        return (stage == this.settings.stageId);
    }


    checkCharacter(character) {
        for (let i=0;i<this.settings.players.length;i++) {
            const player = this.settings.players[i];
            if (character == player.characterId) {
                return true
            }
        }
    }

    checkCharacterWithColor(character, color) {
        for (let i=0;i<this.settings.players.length;i++) {
            const player = this.settings.players[i];
            if (character == player.characterId &&
                color == player.characterColor) {
                return true
            }
        }
    }

    findCharacter(character) {
        for (let i=0;i<this.settings.players.length;i++) {
            const player = this.settings.players[i];
            if (character == player.characterId) {
                return i
            }
        }
    }


    findCharacterWithColor(character, color) {
        for (let i=0;i<this.settings.players.length;i++) {
            const player = this.settings.players[i];
            if (character == player.characterId &&
                color == player.characterColor) {
                return i
            }
        }
    }

    checkLastAttack(lastAttack, playerIndex) {
        return (lastAttack ==
                this.frames[this.stats.lastFrame].players[this.settings.players[playerIndex].port - 1].post.lastAttackLanded);
    }

    didWin(playerIndex) {
        return (this.stats.overall[playerIndex].killCount == 4);
    }
}

function recFindByExt(base,ext,files,result) {
    files = files || fs.readdirSync(base)
    result = result || []

    files.forEach(
        function (file) {
            var newbase = path.join(base,file)
            if ( fs.statSync(newbase).isDirectory() ) {
                result = recFindByExt(newbase,ext,fs.readdirSync(newbase),result)
            }
            else {
                if ( file.substr(-1*(ext.length+1)) == '.' + ext ) {
                    result.push(newbase)
                }
            }
        }
    )
    return result
}

function main() {
    // List of ids: https://docs.google.com/spreadsheets/d/1JX2w-r2fuvWuNgGb6D3Cs4wHQKLFegZe2jhbBuIhCG8/preview#gid=20
    const stage = 8; // Yoshi's Story
    const character1 = {
        characterId: 19, // Sheik
        colorId: 1 // Red
    }
    const character2 = {
        characterId: 2 // Fox
    }
    const lastAttack = 11; // Up Smash

    const replayDir = "slippi"
    const resultDir = "results"
    let result = 0;

    slpList = recFindByExt(`${replayDir}`,'slp')
    console.log(`:: Parsing started on ${replayDir}`)
    for (let i = 0; i<slpList.length; i++) {
        const parse = new Parse(`${slpList[i]}`);
        const percent = Math.round(i/slpList.length*100);
        console.log(`- Testing ${slpList[i]} [${percent}%]`)

        if (parse.isValid() &&
            parse.checkStage(stage) &&
            parse.checkCharacter(character2.characterId) &&
            parse.checkCharacterWithColor(character1.characterId, character1.colorId) &&
            parse.checkLastAttack(lastAttack, parse.findCharacter(character2.characterId)) &&
            parse.didWin(parse.findCharacter(character2.characterId))) {


            console.log("  - Matching criterias !")
            result++;
            mkdirp(resultDir);
            (async () => {
                await cpFile(`${slpList[i]}`, `${resultDir}/result${result}.slp`);
                console.log('File copied');
            })();
        }
    }
}
main();
