const { Command } = require('discord.js-commando');
const Data = require('./../../structures/data.js');
const XP = require('./../../structures/xp.js');
const lib = require('./../../lib.js');

module.exports = class ChallengeCommand extends Command {
    constructor(client) {
                
        super(client, {
            name: 'challenge',
            aliases: [],
            group: 'writing',
            memberName: 'challenge',
            description: 'Generates a random writing challenge for you. e.g. "Write 400 words in 15 minutes". You can add the flags "easy", "hard", "hardcore", or "insane" to choose a pre-set wpm, or just add your chosen wpm as the flag.',
            examples: ['challenge', 'challenge cancel', 'challenge done', 'challenge easy', 'challenge hard', 'challenge hardcore', 'challenge insane', 'challenge 10'],
            args: [
                {
                    key: 'flag',
                    prompt: '',
                    default : '',
                    type: 'string'
                }
            ]
        });
        
        this.wpm = {min: 5, max: 30};
        this.times = {min: 5, max: 60};
        this.guildSettings = [];
        this.waiting = [];
        
    }

    has_challenge(id){
        
        return (this.get_challenge() !== false);
        
    }


    get_challenge(id){
        
        // Check if the user already has a pending challenge
        var userArray = this.guildSettings.challenges;

        var index = userArray.findIndex(function(i){
            return (i.user == id);
        });
        
        return (index >= 0) ? userArray[index] : false;
        
    }
    
    set_challenge(msg, usr, challenge){
        
        var userChallenge = this.get_challenge(usr);
        if (!userChallenge){
            
            this.guildSettings.challenges.push({user: usr, challenge: challenge});
            this.data.s(this.guildSettings);
            
        } else {
            msg.say('You do not have a current challenge. Perhaps you should start one? `challenge`');
        }
        
    }
    
    run_complete(msg, userChallenge){
        
        if (userChallenge){
            
            // Remove the challenge
            var userArray = this.guildSettings.challenges;
            
            userArray.splice(userArray.findIndex(function(i){
                return (i.user == msg.author.id);
            }), 1);

            // Update settings
            this.guildSettings.sprint.challenges = userArray;
            
            // Update xp
            var xp = new XP(msg);
            xp.add(msg.author.id, xp.XP_COMPLETE_CHALLENGE);
            
            // Save
            this.data.s(this.guildSettings);
            
            msg.say(`${msg.author} has completed the challenge **${userChallenge.challenge}**     +${xp.XP_COMPLETE_CHALLENGE} xp`);
            
            
        } else {
            msg.say('You do not have a current challenge. Perhaps you should start one? `challenge`');
        }
        
    }
    
    run_cancel(msg, userChallenge){
        
        if (userChallenge){
            
            // Remove the challenge
            var userArray = this.guildSettings.challenges;
            
            userArray.splice(userArray.findIndex(function(i){
                return (i.user == msg.author.id);
            }), 1);

            // Update settings
            this.guildSettings.sprint.challenges = userArray;
            this.data.s(this.guildSettings);
            
            msg.say('Challenge cancelled.');
            
        } else {
            msg.say('You do not have a current challenge.');
        }
        
    }
    
    run_challenge(msg, userChallenge, flag){
                
        if (!userChallenge){

            var wait = this.waiting.indexOf(msg.author.id);
            if (wait >= 0){
                msg.say('Please respond with either `yes` or `no` to your current challenge.');
                return null;
            }
            
            var wpm = Math.floor(Math.random()*(this.wpm.max - this.wpm.min + 1) + this.wpm.min);
            
            if (flag === 'easy'){
                wpm = 5;
            } else if (flag === 'hard'){
                wpm = 20;
            } else if (flag === 'hardcore'){
                wpm = 40;
            } else if (flag === 'insane'){
                wpm = 60;
            } else if (lib.isNumeric(flag) && flag > 0){
                wpm = flag;
            }
            
            var time = Math.floor(Math.random()*(this.times.max - this.times.min + 1) + this.times.min);
            var goal = wpm * time;

            // Round it down to a neater number
            goal = Math.round(goal / 10) * 10;

            var challenge = `Write at least ${goal} words, in ${time} minutes (${wpm} wpm)`;

            msg.say(`${msg.author}, Your challenge is to: ${challenge}. Will you accept this challenge? \`yes\` or \`no\` (You have 30 seconds to decide)`);
            
            this.waiting.push(msg.author.id);
            wait = this.waiting.indexOf(msg.author.id);

            var check = msg.channel.awaitMessages( m => ( (m.author.id == msg.author.id) && (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'no') ), {
                max: 1,
                time: 30000,
                errors: ['time']
            } ).then(mg => {

                var answer = mg.first().content;
                if (answer === 'yes'){

                    this.set_challenge(msg, msg.author.id, challenge);
                    msg.say(`${msg.author}, Challenge accepted: **${challenge}**\n\`challenge done\` to complete the challenge.\n\`challenge cancel\` to cancel the challenge.`);

                } else {
                    msg.say(`${msg.author}, Challenge declined`);
                }
                
                // Remove waiting
                delete this.waiting[wait];
                
            }).catch((err) => {
                // Remove waiting
                delete this.waiting[wait];
            });
        
        } else {
            
            msg.say(`${msg.author}, your current challenge is: **${userChallenge.challenge}**\n\`challenge done\` to complete the challenge.\n\`challenge cancel\` to cancel the challenge.`);
            
        }
        
    }
    
    run_list(msg){
        
        var challenges = this.guildSettings.challenges;
        var output = '';
        
        if (challenges.length > 0){
            
            for(var k in challenges){
                
                var record = challenges[k];
                var userObj = msg.guild.members.find('id', record.user);
                if (userObj){
                    output += `**${userObj.user.username}** : ${record.challenge}\n`;
                }
                
            }
            
            msg.say('**Active Challenges:**\n\n' + output);
            
        } else {
            msg.say('There are no active challenges on this server.');
        }
        
        
    }

    async run(msg, {flag}) {
        
        this.data = new Data(msg.guild);
        this.guildSettings = this.data.g();
        
        // Create challenges object, if there isn't one
        if (this.guildSettings.challenges === undefined){
            this.guildSettings.challenges = [];
        }  
        
        var userChallenge = this.get_challenge(msg.author.id);
        
        // Cancel
        if (flag === 'cancel'){
            this.run_cancel(msg, userChallenge);
        } else if (flag === 'done'){
            this.run_complete(msg, userChallenge);
        } else if (flag === 'list'){
            this.run_list(msg);
        } else {
            this.run_challenge(msg, userChallenge, flag);
        }
        
        
        
        
        
        
    }
};