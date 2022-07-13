const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on('ready', () => {
  console.log(`I'm Ready!`);
});

client.on('ready', () => {
  client.api.applications(client.user.id).guilds('828194078113529856').commands.post({
    data: {
      name: "checkrarity",
      description: "Check Rarity Command", 
      
      "options": [
    {
      "type": 4,
      "name": "nftnumber",
      "description": "Enter NFT #",
      "required": true
    }
  ] 
      
    }
  });
});

  client.ws.on('INTERACTION_CREATE', async interaction => {
    const command = interaction.data.name.toLowerCase();
    const args = interaction.data.options;

    if (command === 'checkrarity') {
      
    //set nftnum equal to the command argument value. This is a key in the data object
    const nftnum = 'nft' + args[0].value;
      
      client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            embeds: [
              {
                "title": nftdata['collection1'][nftnum].name,
                "description": "Text message. You can use Markdown here. *Italic* **bold** __underline__ ~~strikeout~~ [hyperlink](https://google.com) `code`",
                "color": 15258703,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": nftdata['collection1'][nftnum].rarity + '/' + nftdata[nftcount].value,
                    "inline": true
                    }
                  ],
                "footer": {
                  "text": "Rarity data provided by"
                }
                }
              ]
        }
    }})
   }
  });

client.login(process.env.BOTTOKEN);


var nftdata = {
  
  "collection1" : { 
  
  "nftcount" : 2500,
  
  "nft1" : { name : "MonkeyPoxNFT #1", rarity : "11"}, 
  "nft2" : { name : "MonkeyPoxNFT #2", rarity : "22"}
  
}
} 