require('dotenv').config();

//Discord.js
const Discord = require('discord.js');
var client = new Discord.Client();

//Cron
const CronJob = require('cron').CronJob;
const CronTime = require('cron').CronTime;

//Got
const got = require('got');

//jsdom
const jsdom = require('jsdom');
const { JSDOM } = jsdom;


//FS-Extra
const fs = require('fs-extra');

//Configs
const PREFIX = process.env.PREFIX; 
var regexp = /[^\s"]+|"([^"]*)"/gi;
const robloxfile = './roblox.json';
var roblox = [];
var cronTime = { interval: 1 };

//Ready Event
client.on('ready', () => {
//Load Roblox Data
  var tempJson = fs.readJSONSync(robloxfile);
  roblox = [...tempJson];
  //Start monitoring
  if (cronTime.interval < 60)
    cronUpdate.setTime(new CronTime(`0 */${cronTime.interval} * * * *`));
  else
    cronUpdate.setTime(new CronTime(`0 0 * * * *`));
  cronUpdate.start();

  //log in to the console when the bot starts
  console.log(`Ready! I am ${client.user.username}`);
})

//Message Event
client.on('message', (message) => {

  //Check if the message starts with prefix, if it is a bot or is not the owner
  if (!message.content.startsWith(PREFIX) || !message.author.id === process.env.OWNER || message.author.bot) return;
  var args = [];
  const argsTemp = message.content.slice(PREFIX.length).trim();

  //Split the string in command, and arguments. This part splits on spaces exept if it is between quotes ("a b")
  do {
    var match = regexp.exec(argsTemp);
    if (match != null) {
      args.push(match[1] ? match[1] : match[0]);
    }
  } while (match != null);

  //Make command uppercase so !rit and !RIT both work (including all other commands)
  const CMD_NAME = args.shift().toLowerCase();

  switch (CMD_NAME.toUpperCase()) {

    case "RIT": //Roblox info Tool?
      {
        var embed = new Discord.MessageEmbed();
        for (let i = 0; i < roblox.length; i++) {
          embed.setTitle(`Update Notifier`);
          embed.addField(`${roblox[i].Name}`, `**URL: ${roblox[i].url}**\n**Checked: ${roblox[i].lastChecked}**\n**Updated: ${roblox[i].lastUpdated}**\n**Old Version: ${roblox[i].OldVersion}**\n**Current Version: ${roblox[i].NewRVersion}**`);
          embed.setColor('RANDOM');
        }

        message.channel.send(embed).catch(err => {
        });

      } break;
    case "UPDATE":
      {
        message.channel.send(`Updating roblox version...`);
        update();
        message.channel.send(`Done...`);

      } break;

  }
})


//Update (Obviously) don't change it if you don't know how it works 
function update() {
  let channel = client.channels.cache.get(process.env.CHANNEL);
  for (let i = 0; i < roblox.length; i++) {
    const url = roblox[i].url;
    got(url).then(response => {
      const dom = new JSDOM(response.body);
        var content = dom.window.document.querySelector(roblox[i].css).textContent;
      var time = new Date();
      roblox[i].lastChecked = time.toLocaleString();
      if (roblox[i].NewRVersion != content) {
        var prevUpdate = roblox[i].lastUpdated;
        roblox[i].lastUpdated = time.toLocaleString();
        var OldVersion = roblox[i].NewRVersion;
        roblox[i].NewRVersion = content;
        var embed = new Discord.MessageEmbed();
        embed.setTitle(`🔎 Roblox Update Detected`);
        embed.setDescription(`${process.env.ServerOrExploitName} has detected a Roblox update, please be patient whilst we update.`);
        embed.addField(`Old Version`, `${OldVersion}`, true);
        embed.addField(`New Version`, `${roblox[i].NewRVersion}`, true);
        embed.setColor('Random');
        channel.send(embed);
        fs.outputJSON(robloxfile, roblox, { spaces: 2 }, err => {
          if (err) console.log(err)
        });
        
    }
    }).catch(err => {
      return console.log(`Error: ${err}`);
    });
  }
}
const cronUpdate = new CronJob(`0 */${cronTime.interval} * * * *`, function () {
  var time = new Date();
  update();
}, null, false);

client.login(process.env.BOT_TOKEN);