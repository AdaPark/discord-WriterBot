const { Command } = require('discord.js-commando');
const XP = require('./../../structures/xp.js');


module.exports = class XPCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'xp',
            aliases: ['level'],
            group: 'fun',
            memberName: 'xp',
            description: 'Checks your server Experience Points and Level. Use the "top" flag to see the top 10 on this server.',
            examples: ['`xp` Shows your level/xp', '`xp top` Shows the top 10 users on the server'],
            args: [
                {
                    key: 'who',
                    default: 'me',
                    prompt: '',
                    type: 'string'
                }
            ]
        });
    }

    run(msg, {who}) {
        
        var xp = new XP(msg.guild.id, msg.author.id, msg);
        
        if (who === 'me'){
        
            var user = xp.get();
            
            if (user){
                var left = xp.calcNextLvl(user.lvl, user.xp);
                var output = `${msg.author}, you are **Level ${user.lvl}** (${user.xp}/${user.xp+left})`;        
                msg.say(output);
            } else {
                msg.say(`${msg.author}, you haven't earned any xp on this server yet. You can earn xp by doing writing challenges and sprints.`);
            }
        
        } else if (who === 'top'){
            
            var all = xp.all();

            var output = `\:trophy: LEADERBOARD\n\n`;
            
            for (var i = 0; i < all.length; i++){
                
                var row = all[i];
                var userObj = msg.guild.members.find('id', row.user);
                if (userObj){
                    var lvl = xp.calcLvl(row.xp);
                    output += `\`${i+1}.\` ${userObj.user.username} - **Level ${lvl}** (${row.xp})\n`;
                }
                
            }

            msg.say(output);
            
        } 
        
        
    }
};