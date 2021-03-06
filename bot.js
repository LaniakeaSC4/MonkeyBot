const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] })
const https = require('https')

client.login(process.env.BOTTOKEN)

//main collections array
const collections = []

//import collections
const mpoxdata = require('./monkeypox_nft.json')
const pixelguilddata = require('./pixel_guild_loot_legends.json')
const wanderingnahavidata = require('./wandering_nahavi.json')

//add collections to arrary
collections['monkeypox_nft'] = mpoxdata
collections['pixel_guild_loot_legends'] = pixelguilddata
collections['wandering_nahavi'] = wanderingnahavidata

//================
//====  Setup  ===
//================

//channels and servers
const monkeyserver = '978975057739124767'

const servers = { "server": [{ "id": '978975057739124767', "name": "monkeypox" }, { "id": '901885313608200302', "name": "secretsnake" }] }

const snipeschannel = '996130357260845156'
const mpoxlistingschannel = '992439605569790072'
const pixelguildlistingschannel = '1003741415400022197'
const wanderingnahavilistingschannel = '1003773187349287013'

const mebotid = '980154113637646346'

//set rarity threshold percentages
const pmythic = 0.01
const plegendary = 0.05
const pepic = 0.15
const prare = 0.35
const puncommon = 0.6

//=================
//====  Statup  ===
//=================

//test area
client.on('ready', () => {

  console.log('I am ready!')

  //endable to reset commands
  //clearcommands()

});//end client.on Readys

//function to reset slash commands
async function clearcommands() {
  const guild = await client.guilds.fetch(monkeyserver)
  guild.commands.set([]);
}//end function to reset commands

//==========================
//====  ME new listings  ===
//==========================

//check ME API for new listings test
client.on('ready', async () => {

  //config
  var listings = []//establish the tracked listings var
  var initialget = 20//how many will we get initially (max 20)
  var refreshget = 10//how many will we get on each check (max 20) - should be less then initial get or extras will count as new
  var maxlength = 50//how many records will we keep
  var minutes = 1, the_interval = minutes * 60 * 1000//refresh interval

  //get some listings on startup
  await getnewremotelistings('monkeypox_nft', initialget).then(async thislistings => {
    listings = thislistings//fill tracked listings with the listings we just got
    console.log('added initial ' + initialget + ' listings')
    //console.log(listings[0])
  })//end then

  setInterval(async function () {//do this every X minutes
    console.log("I am doing my " + minutes + " minute check")

    await getnewremotelistings('monkeypox_nft', refreshget).then(async thislistings => {//get latest X listings from Magic Eden

      console.log('Listings arrary length at start: ' + listings.length)

      var rebuildarrary = listings//save all the acquired listings in a temporary arrary

      for (var i = 0; i < thislistings.length; i++) {//for all listings recieved from getnewremotelistingsfunction

        if (listings.some(e => (e.tokenAddress === thislistings[i].tokenAddress && e.price === thislistings[i].price))) {
          //actions if token address and price match (i.e. we've seen this one before)
          //console.log('matched ' + thislistings[i].tokenAddress + ' at price ' + thislistings[i].price)

        } else {
          //actions if token address or price does not match one we have seen before
          console.log('New/updated entry ' + thislistings[i].tokenAddress + ' at price ' + thislistings[i].price)
          rebuildarrary.unshift(thislistings[i])//add the new entry to the start of the rebuild arrary so we can remember this one if we see it later

          console.log('getting token details from magic eden')
          await getremotetokendetails(thislistings[i].tokenMint).then(async thistoken => {
            //console.log('here are the new token details')
            //console.log(thistoken)
            
            //get nft ID
            let namearr = thistoken.name.split(' ')
            for (var i = 0; i < namearr.length; i++) {
              let checkthis = namearr[i]
              if (checkthis.includes('#')) {

                var nlength = checkthis.length
                nftid = checkthis.substring(1, nlength)
                console.log('NFT ID from ME is: ' + nftid)

              }//end if
            }//end for

            //get rarity
           console.log('logging two tokens')
          console.log(thistoken) 
          console.log(listings[0])

          })//end thistoken

        }

      }//end for loop of each listing recieved

      console.log('Listings arrary length at end: ' + listings.length)

      if (rebuildarrary.length > maxlength) {
        var numbertoremove = rebuildarrary.length - maxlength
        console.log('number to remove is: ' + numbertoremove)
        for (var i = 0; i < numbertoremove; i++) {
          console.log("1 removal loop - popping here")
          rebuildarrary.pop()//remove oldest entry
        }//end for number to remove
      }//end if rebuildarrary is longer than max length

      listings = rebuildarrary//overwrite main listings arrary with the temp rebuild one

    })//end then after getting listings
  }, the_interval)//end recheck listing loop
})//end client.on Ready

//returns x number of recent listings from Magic Eden
function getnewremotelistings(collection, number) {
  return new Promise((resolve, reject) => {
    var thiscollection = 'https://api-mainnet.magiceden.dev/v2/collections/' + collection + '/listings?offset=0&limit=' + number//build collection URL

    https.get(thiscollection, (resp) => {
      let data = ''
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk
      })

      // The whole response has been received.
      resp.on('end', () => {
        var thislistings = JSON.parse(data)
        resolve(thislistings)//return the recieved X listings
      })
    }).on("error", (err) => { console.log("Error: " + err.message) })
  }) //end promise
}//end getnewremotelistings function

//returns token details from Magic Eden
async function getremotetokendetails(mintaddress) {
  return new Promise((resolve, reject) => {
    var thisurl = 'https://api-mainnet.magiceden.dev/v2/tokens/' + mintaddress//build token URL

    https.get(thisurl, (resp) => {
      let data = ''
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk
      })

      // The whole response has been received.
      resp.on('end', () => {
        var thistoken = JSON.parse(data)
        resolve(thistoken)//return the recieved tokendetails
      })
    }).on("error", (err) => { console.log("Error: " + err.message) })
  }) //end promise
}//end getremotetokendetails function


//====================
//====  Functions  ===
//====================

//returns floor price from Magic Eden API
function getremotefloorprice(collection) {
  return new Promise((resolve, reject) => {

    //build collection URL
    var thiscollection = 'https://api-mainnet.magiceden.dev/v2/collections/' + collection + '/stats'

    https.get(thiscollection, (resp) => {
      let data = ''
      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk
      });
      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        var rawFP = parseFloat(JSON.parse(data).floorPrice)//get FP in Sol
        var thisFP = rawFP / 1000000000
        resolve(thisFP)
      })
    }).on("error", (err) => { console.log("Error: " + err.message) })
  }) //end promise
}//end getremotefloorprice function

//get ranges for this collection (from local data)
function getlocalranges(collection) {

  //initialise threshold variables
  var mythicstart = 0; var mythicend = 0
  var legendarystart = 0; var legendaryend = 0
  var epicstart = 0; var epicend = 0
  var rarestart = 0; var rareend = 0
  var uncommonstart = 0; var uncommonend = 0
  var commonend = 0; var commonend = 0

  //mythic range (start of range is 1)
  mythicstart = 1;
  mythicend = Math.floor(collections[collection].result.data.items.length * pmythic)

  //legendary range
  legendarystart = Math.ceil(collections[collection].result.data.items.length * pmythic)
  if (legendarystart === mythicend) { legendarystart = legendarystart + 1 }
  legendaryend = Math.floor(collections[collection].result.data.items.length * plegendary)

  //epic range
  epicstart = Math.ceil(collections[collection].result.data.items.length * plegendary)
  if (epicstart === legendaryend) { epicstart = epicstart + 1 }
  epicend = Math.floor(collections[collection].result.data.items.length * pepic)

  //rare range
  rarestart = Math.ceil(collections[collection].result.data.items.length * pepic)
  if (rarestart === epicend) { rarestart = rarestart + 1 }
  rareend = Math.floor(collections[collection].result.data.items.length * prare)

  //uncommon range
  uncommonstart = Math.ceil(collections[collection].result.data.items.length * prare)
  if (uncommonstart === rareend) { Uncommonstart = uncommonstart + 1 }
  uncommonend = Math.floor(collections[collection].result.data.items.length * puncommon)

  //common range (end of range is same as NFT count)
  commonstart = Math.ceil(collections[collection].result.data.items.length * puncommon)
  if (commonstart === uncommonend) { commonstart = commonstart + 1 }
  commonend = collections[collection].result.data.items.length

  console.log('Mythic: ' + mythicstart + ' - ' + mythicend + '. Legendary: ' + legendarystart + ' - ' + legendaryend + '. Epic: ' + epicstart + ' - ' + epicend + '. Rare: ' + rarestart + ' - ' + rareend + '. Uncommon: ' + uncommonstart + ' - ' + uncommonend + '. Common: ' + commonstart + ' - ' + commonend + '.')

  var returnranges = [collection, mythicstart, mythicend, legendarystart, legendaryend, epicstart, epicend, rarestart, rareend, uncommonstart, uncommonend, commonstart, commonend]

  return (returnranges)//return arrary

}//end getlocalranges function

//get rarity rank by nft# from local data
function checklocalrarity(nftnumber, collection) {

  //initalise some variables as strings
  var raritydescription = ""; var emoji = ""; var embedcolor = ""; var thisrarity = ""; var thisname = ""; var thisimage = ""

  //calculate the ranges for this checklocalrarity test
  var thisranges = getlocalranges(collection)

  //seperate out ranges returned from function
  var mythicstart = thisranges[1]; var mythicend = thisranges[2]
  var legendarystart = thisranges[3]; var legendaryend = thisranges[4]
  var epicstart = thisranges[5]; var epicend = thisranges[6]
  var rarestart = thisranges[7]; var rareend = thisranges[8]
  var uncommonstart = thisranges[9]; var uncommonend = thisranges[10]
  var commonend = thisranges[11]; var commonend = thisranges[12]

  //loop through NFTs in collection looking for NFT ID. If found set thisrarity to statistical rarity
  for (var i = 0; i < collections[collection].result.data.items.length; i++) {

    if (collections[collection].result.data.items[i].id == nftnumber) {
      console.log('found ' + collections[collection].result.data.items[i].name)
      thisrarity = collections[collection].result.data.items[i].all_ranks.statistical_rarity
      thisname = collections[collection].result.data.items[i].name
      thisimage = collections[collection].result.data.items[i].image
      console.log('this rarity is: ' + thisrarity)
    }//end if

  }//end for

  if (thisrarity != null) {

    console.log('NFT rarity found in the databse')

    //if mythic
    if (thisrarity >= mythicstart && thisrarity <= mythicend) {
      console.log('mythic!')
      raritydescription = 'Mythic'
      emoji = '<:mythic:997639717665386586>'
      embedcolor = 0xed2839
    }

    //if Legendary
    else if (thisrarity >= legendarystart && thisrarity <= legendaryend) {
      console.log('legendary!')
      raritydescription = 'Legendary'
      emoji = '<:legendary:997639764943585421>'
      embedcolor = 0xfe8100
    }

    //if epic
    else if (thisrarity >= epicstart && thisrarity <= epicend) {
      console.log('epic!')
      raritydescription = 'Epic'
      emoji = '<:epic:997639797558497421>'
      embedcolor = 0x9901f6
    }

    //if rare
    else if (thisrarity >= rarestart && thisrarity <= rareend) {
      console.log('Rare!')
      raritydescription = 'Rare'
      emoji = '<:rare:997639830844477471>'
      embedcolor = 0x19aaeb
    }

    //if uncommon
    else if (thisrarity >= uncommonstart && thisrarity <= uncommonend) {
      console.log('uncommmon!')
      raritydescription = 'Uncommon'
      emoji = '<:uncommon:997639865065799770>'
      embedcolor = 0x20d48a
    }

    //if common
    else if (thisrarity >= commonstart && thisrarity <= commonend) {
      console.log('Common')
      raritydescription = 'Common'
      emoji = '<:common:997639893306064997>'
      embedcolor = 0x939394
    }

    else {//this shouldnt trigger if the key is found and the data is complete
      console.log('not ranked'); raritydescription = 'not ranked'; emoji = '<:common:997639893306064997>'; embedcolor = 0x939394
    }

    //set up array to return
    var nftproperties = [nftnumber, raritydescription, emoji, embedcolor, thisrarity, thisname, thisimage]
    return (nftproperties)//return arrary

  } else {//if nftkey was not found in DB
    var nftproperties = [nftnumber, 'Not found', '<:common:997639893306064997>', 0x3b0202, 'Not Found', 'No Name', '']
    return (nftproperties)
  }//end if nft is in object
}//end checklocalrarity function

//==============================
//====  Setup slash command  ===
//==============================

//setup discord slash command
client.on('ready', () => {
  for (var i = 0; i < servers.server.length; i++) {
    client.api.applications(client.user.id).guilds(servers.server[i].id).commands.post({//adding commmand to our servers
      data: {
        "name": "checkrarity",
        "description": "Check the rarity of an NFT in a collection we support",
        "options": [
          {
            "type": 3,
            "name": "collection",
            "description": "Please select a collection",
            "choices": [
              {
                "name": "MonkeyPox NFT",
                "value": "monkeypox_nft"
              },
              {
                "name": "Pixel Guild",
                "value": "pixel_guild_loot_legends"
              }
            ],
            "required": true
          },
          {
            "type": 3,
            "name": "nftnumber",
            "description": "Enter the # of the NFT to check in selected collection",
            "required": true
          }
        ]
      }//end data
    });//end post
  }//end for servers loop
});//end client on ready

//respond to slash command
client.ws.on('INTERACTION_CREATE', async interaction => {
  const command = interaction.data.name.toLowerCase()
  const args = interaction.data.options//array of the provided data after the slash

  if (command === 'checkrarity') {

    var nftproperties = checklocalrarity(args[1].value, args[0].value)//first argument should be the nft #. Send it to checklocalrarity function. Returns array.

    //split up returned array
    var nftnumber = nftproperties[0]; var raritydescription = nftproperties[1]; var emoji = nftproperties[2]; var embedcolor = nftproperties[3]; var thisrarity = nftproperties[4]; var nftname = nftproperties[5]; var thisimage = nftproperties[6];

    if (raritydescription != 'Not found') {//if NFT number was not found in DB, 'Not found' would be returned. If it was found, proceed
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            embeds: [
              {
                "title": nftname,
                "color": embedcolor,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": emoji + emoji + '|  ' + thisrarity + ' - ' + raritydescription + '  |' + emoji + emoji,
                    "inline": true
                  }
                ],
                "image": {
                  "url": thisimage,
                  "height": 75,
                  "width": 75
                },
                "footer": {
                  "text": "Rarity data provided by howrare.is"
                }
              }
            ]//end embed
          }//end message data
        }//end post data
      })//end post()

    } else {//end if rarity description != not found
      client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
          type: 4,
          data: {
            embeds: [
              {
                "title": 'Token not found in database',
                "color": embedcolor,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": emoji + emoji + '|  ' + ' - ' + raritydescription + '  |' + emoji + emoji,
                    "inline": true
                  }
                ],
                "footer": {
                  "text": "Rarity data provided by howrare.is"
                }
              }
            ]//end embed
          }//end message data
        }//end post data
      })//end post()
    }//end else (if rarity description = 'Not found')
  }//end if command = rarity
})//end response to slash command

//========================
//====  Rarity Sniper  ===
//========================

async function checksnipe(message, collection) {

  let embed = message.embeds[0]//get the embeds (if any) from the message so we can check it

  //if there is an embed, the message was from the right bot and it's a listing rather than a sale...
  if (embed != undefined && message.author.id == mebotid && embed.description.includes('listed')) {

    //console.log(embed.description)

    //get list price from ME bot post
    var thispricestring = ''
    var thisprice = 0

    let descriptionarr = embed.description.split(' ')

    for (var i = 0; i < descriptionarr.length; i++) {
      let checkthis = descriptionarr[i]
      if (checkthis === 'SOL') {

        let x = i - 1
        thispricestring = descriptionarr[x]
        thisprice = parseFloat(thispricestring)
        //console.log('Listed for: ' + thisprice)

      }
    }//end for loop checking each word in the listing description for the list price

    //await floor price
    await getremotefloorprice(collection).then(floorprice => {

      //console.log('Floor price in check snipe function is: ' + floorprice)

      //get rarity of this listing
      var nftid = ''

      //get nft ID
      for (var i = 0; i < descriptionarr.length; i++) {
        let checkthis = descriptionarr[i]
        if (checkthis.includes('#')) {

          var nlength = checkthis.length
          nftid = checkthis.substring(1, nlength)
          //console.log('NFT ID is: ' + nftid)

        }//end if
      }//end for

      //get rarity of nft with function (need whole rarity database).or handle function returning 0
      var nftproperties = checklocalrarity(nftid, collection)
      //split up returned array
      var nftkey = nftproperties[0]; var raritydescription = nftproperties[1]; var emoji = nftproperties[2]; var embedcolor = nftproperties[3]; var thisrarity = nftproperties[4]; var nftname = nftproperties[5]; var thisimage = nftproperties[6]; var melink = nftproperties[7]

      //make calculation of if this is a snipe using rarity, floor price and nft price
      var hotrarities = ['Mythic', 'Legendary', 'Epic', 'Rare']

      if (hotrarities.includes(raritydescription)) {
        //if this is a snipe, send alert to snipe channel

        //set multipliers above floor price at which listings become snipes
        var mythiclimit = 100
        var legendarylimit = 50
        var epiclimit = 10
        var rarelimit = 5

        var thislimit = 0//establish snipe limit for this round

        //calculate snipe limits
        var mythicsnipe = mythiclimit * floorprice
        var legendarysnipe = legendarylimit * floorprice
        var epicsnipe = epiclimit * floorprice
        var raresnipe = rarelimit * floorprice

        var thissnipeprice = 0

        var issnipe = false

        if (raritydescription == 'Mythic' && thisprice <= mythicsnipe) { issnipe = true; thislimit = mythiclimit; thissnipeprice = mythicsnipe } else if (raritydescription == 'Legendary' && thisprice <= legendarysnipe) { issnipe = true; thislimit = legendarylimit; thissnipeprice = legendarysnipe } else if (raritydescription == 'Epic' && thisprice <= epicsnipe) { issnipe = true; thislimit = epiclimit; thissnipeprice = epicsnipe } else if (raritydescription == 'Rare' && thisprice <= raresnipe) { issnipe = true; thislimit = rarelimit; thissnipeprice = raresnipe }
        if (issnipe == true) {
          client.guilds.cache.get(monkeyserver).channels.cache.get(snipeschannel).send({
            "content": "@everyone",
            embeds: [
              {
                "title": 'Snipe Opportunity: ' + nftname,
                "color": embedcolor,
                "fields": [
                  {
                    "name": "Rarity",
                    "value": thisrarity + ' - ' + raritydescription,
                    "inline": true
                  },
                  {
                    "name": "Snipe Price",
                    "value": 'For ' + raritydescription + ': ' + thislimit + 'x floor price of ' + floorprice + 'SOL (' + thissnipeprice + 'SOL)',
                    "inline": true
                  },
                  {
                    "name": "List Price",
                    "value": thisprice + ' SOL',
                    "inline": true
                  },
                  {
                    "name": "Floor Price",
                    "value": floorprice + ' SOL',
                    "inline": true
                  }
                ],
                "image": {
                  "url": thisimage,
                  "height": 75,
                  "width": 75
                },
                "footer": {
                  "text": "Rarity data provided by howrare.is"
                }
              }
            ]//end embed
          })//end message send
        } //if issnipe = true 
      } // if a hot rarity
    })//end await floorprice
  }//end if sender is ME Bot 
}//end checksnipe function

client.on("messageCreate", (message) => {//watch new messages in the listings channel

  if (message.channel.id == mpoxlistingschannel) {//if channel is the monkeypox listings channel

    checksnipe(message, 'monkeypox_nft')

  }//end if mpoxlistingschannel

  if (message.channel.id == pixelguildlistingschannel) {//if channel is the pixel guild listings channel

    //checksnipe(message, 'pixel_guild_loot_legends')

  }//end if pixelguidlistingschannel

  if (message.channel.id == wanderingnahavilistingschannel) {//if channel is the wandering_nahavi listings channel

    checksnipe(message, 'wandering_nahavi')

  }//end if pixelguidlistingschannel

})//end client on message
