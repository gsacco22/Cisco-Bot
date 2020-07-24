//Webex Bot Starter - featuring the webex-node-bot-framework - https://www.npmjs.com/package/webex-node-bot-framework

var framework = require('webex-node-bot-framework');
var webhook = require('webex-node-bot-framework/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(express.static('images'));
const config = require("./config.json");
const {spawn} = require('child_process')
const path = require('path')

// init framework
var framework = new framework(config);
framework.start();
console.log("Starting framework, please wait...");

framework.on("initialized", function () {
  console.log("framework is all fired up! [Press CTRL-C to quit]");
});

// A spawn event is generated when the framework finds a space with your bot in it
// If actorId is set, it means that user has just added your bot to a new space
// If not, the framework has discovered your bot in an existing space
framework.on('spawn', (bot, id, actorId) => {
  if (!actorId) {
    // don't say anything here or your bot's spaces will get
    // spammed every time your server is restarted
    console.log(`While starting up, the framework found our bot in a space called: ${bot.room.title}`);
  } else {
    console.log("Started correctly!")
    bot.say('Hi there, you can say hello to me.  Don\'t forget you need to mention me in a group space!');
    // When actorId is present it means someone added your bot got added to a new space
    // Lets find out more about them..
    var msg = 'You can say `help` to get the list of words I am able to respond to.';
    bot.webex.people.get(actorId).then((user) => {
      msg = `Hello there ${user.displayName}. ${msg}`;
    }).catch((e) => {
      console.error(`Failed to lookup user details in framwork.on("spawn"): ${e.message}`);
      msg = `Hello there. ${msg}`;
    }).finally(() => {
      // Say hello, and tell users what you do!
      if (bot.isDirect) {
        bot.say('markdown', msg);
      } else {
        let botName = bot.person.displayName;
        msg += `\n\nDon't forget, in order for me to see your messages in this group space, be sure to *@mention* ${botName}.`;
        bot.say('markdown', msg);
      }
    });
  }
});


//Process incoming messages

let responded = false;
/* On mention with command
ex User enters @botname help, the bot will write back in markdown
*/
framework.hears(/help|what can i (do|say)|what (can|do) you do/i, function (bot, trigger) {
  console.log(`someone needs help! They asked ${trigger.text}`);
  responded = true;
  bot.say(`Hello ${trigger.person.displayName}.`)
    .then(() => sendHelp(bot))
    .catch((e) => console.error(`Problem in help hander: ${e.message}`));
});

/* On mention with command
ex User enters @botname framework, the bot will write back in markdown
*/
framework.hears('framework', function (bot) {
  console.log("framework command received");
  responded = true;
  bot.say("markdown", "This bot was created by Michael Snider (misnider@cisco.com) and Grace Sacco (grsacco@ciscoc.com). It was created for the 2020 Hackathon for Field Sales Engineer Interns. This bot contains uses such as seeing network scan statistics, automation of new hire onboarding, and contact resource automation. ");
});

/* On mention with command, using other trigger data, can use lite markdown formatting
ex User enters @botname 'info' phrase, the bot will provide personal details
*/
framework.hears('info', function (bot, trigger) {
  console.log("info command received");
  responded = true;
  //the "trigger" parameter gives you access to data about the user who entered the command
  let personAvatar = trigger.person.avatar;
  let personEmail = trigger.person.emails[0];
  let personDisplayName = trigger.person.displayName;
  let outputString = `Here is your personal information: \n\n\n **Name:** ${personDisplayName}  \n\n\n **Email:** ${personEmail} \n\n\n **Avatar URL:** ${personAvatar}`;
  bot.say("markdown", outputString);
});

/* On mention with bot data
ex User enters @botname 'space' phrase, the bot will provide details about that particular space
*/

framework.hears('space', function (bot) {
  console.log("space. the final frontier");
  responded = true;
  let roomTitle = bot.room.title;
  let spaceID = bot.room.id;
  let roomType = bot.room.type;

  let outputString = `The title of this space: ${roomTitle} \n\n The roomID of this space: ${spaceID} \n\n The type of this space: ${roomType}`;

  console.log(outputString);
  bot.say("markdown", outputString)
    .catch((e) => console.error(`bot.say failed: ${e.message}`));

});

/*
   Say hi to every member in the space
   This demonstrates how developers can access the webex
   sdk to call any Webex API.  API Doc: https://webex.github.io/webex-js-sdk/api/
*/
framework.hears("say hi to everyone", function (bot) {
  console.log("say hi to everyone.  Its a party");
  responded = true;
  // Use the webex SDK to get the list of users in this space
  bot.webex.memberships.list({roomId: bot.room.id})
    .then((memberships) => {
      for (const member of memberships.items) {
        if (member.personId === bot.person.id) {
          // Skip myself!
          continue;
        }
        let displayName = (member.personDisplayName) ? member.personDisplayName : member.personEmail;
        bot.say(`Hello ${displayName}`);
      }
    })
    .catch((e) => {
      console.error(`Call to sdk.memberships.get() failed: ${e.messages}`);
      bot.say('Hello everybody!');
    });
});

// Buttons & Cards data
let cardJSON = {
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  type: 'AdaptiveCard',
  version: '1.0',
  body:
    [{
      type: 'ColumnSet',
      columns:
        [{
          type: 'Column',
          width: '5',
          items:
            [{
              type: 'Image',
              url: 'Your avatar appears here!',
              size: 'large',
              horizontalAlignment: "Center",
              style: 'person'
            },
            {
              type: 'TextBlock',
              text: 'Your name will be here!',
              size: 'medium',
              horizontalAlignment: "Center",
              weight: 'Bolder'
            },
            {
              type: 'TextBlock',
              text: 'And your email goes here!',
              size: 'small',
              horizontalAlignment: "Center",
              isSubtle: true,
              wrap: false
            }]
        }]
    }]
};
// Buttons & Cards data for User Info Input
let cardBody = {
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  version: "1.2",
  type: "AdaptiveCard",
  body: [
    {
        type: "ColumnSet",
        columns: [
            {
                type: "Column",
                items: [
                    {
                        type: "TextBlock",
                        text: "New Hire Orientation - Zeus Clothing Stores",
                        horizontalAlignment: "Center",
                        wrap: true,
                        color: "Accent",
                        size: "Large",
                        spacing: "Small",
                        weight: "Bolder"
                    },
                    {
                        type: "TextBlock",
                        text: "Please enter your full name."
                    },
                    {
                        type: "Input.Text",
                        placeholder: "Jane Doe ",
                        id: "FullName"
                    },
                    {
                        type: "TextBlock",
                        text: "Please enter your permanent address.",
                        wrap: true
                    },
                    {
                        type: "Input.Text",
                        placeholder: "123 Cisco Ave, Raleigh NC, 27513",
                        id: "Address"
                    }
                ],
                width: "stretch"
            }
        ]
    },
    {
        type: "TextBlock",
        text: "Please enter your cell phone number. "
    },
    {
        type: "Input.Text",
        placeholder: "123 456 7890",
        id: "CellPhoneNumber"
    },
    {
        type: "TextBlock",
        text: "Please enter your home phone number. "
    },
    {
        type: "Input.Text",
        placeholder: "123 456 7890",
        id: "HomePhoneNumber"
    },
    {
        type: "TextBlock",
        text: "Please enter your date of birth. (MMDDYYYY)"
    },
    {
        type: "Input.Date",
        id: "Birthdate"
    },
    {
        type: "TextBlock",
        text: "Please enter the name of your emergency contact. "
    },
    {
        type: "Input.Text",
        placeholder: "John Doe",
        id: "NameEmergencyContact"
    },
    {
        type: "TextBlock",
        text: "Please enter your relationship to the emergency contact."
    },
    {
        type: "Input.Text",
        placeholder: "Mother",
        id: "RelationshipEmergencyContact"
    },
    {
        type: "TextBlock",
        text: "Please enter your emergency contact's cell phone number."
    },
    {
        type: "Input.Text",
        placeholder: "123 456 7890",
        id: "EmergencyContactPhone"
    },
    {
        type: "TextBlock",
        text: "Please confirm that you have finished your NHO training."
    },
    {
        type: "Input.Toggle",
        title: "Please check the box to the left to confirm.",
        value: "false",
        id: "ConfirmNHO"
    }
],
};
// Buttons & Cards data for contacts to the ZELT
let cardBodyBosses = {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.2",
    body: [
        {
            type: "ColumnSet",
            columns: [
                {
                    type: "Column",
                    items: [
                        {
                            type: "TextBlock",
                            weight: "Bolder",
                            text: "Zeus Clothing's Executive Leadership Team Contacts",
                            horizontalAlignment: "Center",
                            wrap: true,
                            color: "Light",
                            size: "Large",
                            spacing: "Small"
                        }
                    ],
                    width: "stretch"
                }
            ]
        },
        {
            type: "TextBlock",
            text: "Zachary Seinfeld",
            horizontalAlignment: "Center"
        },
        {
            type: "Image",
            url: "https://media-exp1.licdn.com/dms/image/C5603AQGxU9GrYrE6BA/profile-displayphoto-shrink_200_200/0?e=1600905600&v=beta&t=jqKnSRzyMhuy2xSy8suFbxTVaIR-MWWIpz0rnXbZae8",
            size: "Medium",
            horizontalAlignment: "Center"
        },
        {
            type: "ActionSet",
            actions: [
                {
                    type: "Action.OpenUrl",
                    title: "LinkedIn",
                    url: "https://www.linkedin.com/in/zachary-seinfeld-4572ba16a/"
                },
                {
                    type: "Action.OpenUrl",
                    title: "ZEC",
                    url: "https://directory.cisco.com/dir/details/zseinfel"
                }
            ],
            horizontalAlignment: "Center"
        },
        {
            type: "TextBlock",
            text: "Sam Wosika",
            horizontalAlignment: "Center"
        },
        {
            type: "Image",
            url: "https://www.uwstout.edu/sites/default/files/inline-images/wosika%2Csam1a.jpg",
            horizontalAlignment: "Center",
            size: "Medium"
        },
        {
            type: "ActionSet",
            actions: [
                {
                    type: "Action.OpenUrl",
                    title: "LinkedIn",
                    url: "https://www.linkedin.com/in/samuel-wosika/"
                },
                {
                    type: "Action.OpenUrl",
                    title: "ZEC",
                    url: "https://directory.cisco.com/dir/details/swosika"
                }
            ],
            horizontalAlignment: "Center"
        },
        {
            type: "TextBlock",
            text: "Danielle Stacy",
            horizontalAlignment: "Center"
        },
        {
            type: "Image",
            url: "https://media-exp1.licdn.com/dms/image/C4D03AQFhHVgYyCn3ug/profile-displayphoto-shrink_800_800/0?e=1600905600&v=beta&t=5-fSPL8S_Y70NIvGj4IVjIgObKgXJXnvJC7so2K8L0Q",
            horizontalAlignment: "Center",
            size: "Medium"
        },
        {
            type: "ActionSet",
            actions: [
                {
                    type: "Action.OpenUrl",
                    title: "LinkedIn",
                    url: "https://www.linkedin.com/in/danielle-stacy/"
                },
                {
                    type: "Action.OpenUrl",
                    title: "ZEC",
                    url: "https://directory.cisco.com/dir/details/dastacy"
                }
            ],
            horizontalAlignment: "Center"
        },
        {
            type: "TextBlock",
            text: "Sonny Malick",
            horizontalAlignment: "Center"
        },
        {
            type: "Image",
            url: "https://media-exp1.licdn.com/dms/image/C4E03AQGS7mkMd2oHLg/profile-displayphoto-shrink_800_800/0?e=1600905600&v=beta&t=8Ex9jWybo9WGiSpHMBcogGYAQNYu1jwGwagl0hE6-Xw",
            horizontalAlignment: "Center",
            size: "Medium"
        },
        {
            type: "ActionSet",
            actions: [
                {
                    type: "Action.OpenUrl",
                    title: "LinkedIn",
                    url: "https://www.linkedin.com/in/sonny-malick-5700a8b6/"
                },
                {
                    type: "Action.OpenUrl",
                    title: "ZEC",
                    url: "https://directory.cisco.com/dir/reports/somalick"
                }
            ],
            horizontalAlignment: "Center"
        }
    ],
};
// Buttons & Cards data for Training Links
let cardBodyNHO = {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.0",
    body:
      [{
            type: "TextBlock",
            text: "New Hire Orientation Training Requirements ",
            horizontalAlignment: "Center",
            size: "Medium",
            weight: "Bolder",
            color: "Accent"
          },
          {
            type: "TextBlock",
            text: "Welcome to Zeus Clothing! "
          },
          {
            type: "TextBlock",
            text: "Please follow the links to complete your required training!"
        },
        {
            type: "ActionSet",
            actions: [
                {
                    type: "Action.OpenUrl",
                    title: "1",
                    id: "FirstLink",
                    url: "https://www.monster.ca/career-advice/article/10-ways-to-be-professional-at-work-canada"
                },
                {
                    type: "Action.OpenUrl",
                    title: "2",
                    id: "SecondLink",
                    iconUrl: "",
                    url: "https://www.richardson.com/increase-revenue-by-industry/retail-sales-training/"
                },
                {
                    type: "Action.OpenUrl",
                    title: "3",
                    iconUrl: "",
                    id: "ThirdLink",
                    url: "https://whizbangtraining.com/retail-selling-videos/"
                },
                {
                    type: "Action.OpenUrl",
                    title: "4",
                    id: "FourthLink",
                    url: "https://thefriedmangroup.com/customer-engagement-sales-training/"
                },
                {
                    type: "Action.OpenUrl",
                    title: "5",
                    url: "https://www.dol.gov/odep/topics/youth/softskills/Professionalism.pdf",
                    id: "FifthLink"
                }
            ]
        }
    ],
  };

/* On mention with card example
ex User enters @botname 'card me' phrase, the bot will produce a personalized card - https://developer.webex.com/docs/api/guides/cards
*/
framework.hears('card me', function (bot, trigger) {
  console.log("someone asked for a card");
  responded = true;
  let avatar = trigger.person.avatar;

  cardJSON.body[0].columns[0].items[0].url = (avatar) ? avatar : `${config.webhookUrl}/missing-avatar.jpg`;
  cardJSON.body[0].columns[0].items[1].text = trigger.person.displayName;
  cardJSON.body[0].columns[0].items[2].text = trigger.person.emails[0];
  bot.sendCard(cardJSON, 'This is customizable fallback text for clients that do not support buttons & cards');
});

/* On mention reply example
ex User enters @botname 'reply' phrase, the bot will post a threaded reply
*/
framework.hears('reply', function (bot, trigger) {
  console.log("someone asked for a reply.  We will give them two.");
  responded = true;
  bot.reply(trigger.message,
    'This is threaded reply sent using the `bot.reply()` method.',
    'markdown');
  var msg_attach = {
    text: "This is also threaded reply with an attachment sent via bot.reply(): ",
    file: 'https://media2.giphy.com/media/dTJd5ygpxkzWo/giphy-downsized-medium.gif'
  };
  bot.reply(trigger.message, msg_attach);
});

let cardBodyThreats = {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.2",
    type: "AdaptiveCard",
    body: [
        {
            type: "ColumnSet",
            columns: [
                {
                    type: "Column",
                    items: [
                        {
                            type: "Image",
                            style: "Person",
                            url: "https://www.cisco.com/c/en_sg/products/security/amp-for-endpoints/index/_jcr_content/Grid/category_atl_946f/layout-category-atl/blade_60f8/bladeContents/halves_35d6/H-Half-1/spotlight_3c0a/image.img.png/1561962344096.png",
                            size: "Medium",
                            height: "50px"
                        }
                    ],
                    width: "auto"
                },
                {
                    type: "Column",
                    items: [
                        {
                            type: "TextBlock",
                            text: "Cisco Advanced Malware Protection",
                            weight: "Lighter",
                            color: "Accent",
                            height: "stretch"
                        }
                    ],
                    width: "stretch"
                }
            ]
        },
        {
            type: "TextBlock",
            text: "Total amount of malware threats detected:",
            color: "Accent"
        },
        {
            type: "TextBlock",
            text: "threatsFirst"
        },
        {
            type: "TextBlock",
            text: "Total amount of scans completed with no detections:",
            spacing: "Medium",
            horizontalAlignment: "Left",
            color: "Accent"
        },
        {
            type: "TextBlock",
            text: "threatsSecond"
        },
        {
            type: "TextBlock",
            text: "Total amount of scans completed with detections:",
            color: "Accent"
        },
        {
            type: "TextBlock",
            text: "threatsThird"
        },
        {
            type: "TextBlock",
            text: "Total amount of threats AMP has detected:",
            color: "Accent"
        },
        {
            type: "TextBlock",
            text: "threatsFourth"
        },
        {
            type: "TextBlock",
            text: "Total amount of threats quarantined:",
            color: "Accent"
        },
        {
            type: "TextBlock",
            text: "threatsFifth"
        }
    ],
};

/**
 * Run python script
 * @return {ChildProcess}
 */
function runScript(){
  return spawn('/Users/misnider/Documents/devnet/dne-security-code/venv/bin/python3', ["./threats.py"]);
}

/* On mention for threats
ex User enters @botname 'threats' phrase, the bot will deliver the number of threats caught by AMP
*/
framework.hears('threats', function (bot, trigger) {
  console.log("someone asked for threats");
  responded = true;
  threats = []
  const subprocess = runScript()
  subprocess.stdout.on('data', (data) => {
    threats = data.toString('utf8').split("|")
    cardBodyThreats.body[2].text = threats[0];
    cardBodyThreats.body[4].text = threats[1];
    cardBodyThreats.body[6].text = threats[2];
    cardBodyThreats.body[8].text = threats[3];
    cardBodyThreats.body[10].text = threats[4];
    bot.sendCard(cardBodyThreats, 'This is fallback text for clients that do not support buttons & cards');
    // bot.say("Total amount of malware threats AMP has detected: " + threats[0]);
    // bot.say("Total amount of scans completed with no detections from AMP: " + threats[1]);
    // bot.say("Total amount of scans completed with detections from AMP: " + threats[2]);
    // bot.say("Total amount of threats AMP has detected: " + threats[3]);
    // bot.say("Total amount of threats AMP has quarantined: " + threats[4]);
  });
  subprocess.stderr.on('data', (data) => {
    console.log(`error: ${data}`);
  });
  subprocess.on('close', () => {
  });




  // let avatar = trigger.person.avatar;

  // cardJSON.body[0].columns[0].items[0].url = (avatar) ? avatar : `${config.webhookUrl}/missing-avatar.jpg`;
  // cardJSON.body[0].columns[0].items[1].text = trigger.person.displayName;
  // cardJSON.body[0].columns[0].items[2].text = trigger.person.emails[0];
  // bot.sendCard(cardJSON, 'This is customizable fallback text for clients that do not support buttons & cards');
});

framework.hears('new hire', function (bot, trigger) {
  let personDisplayName = trigger.person.displayName;
  let outputString = `The following new hire has begun their orientation: ${personDisplayName}`;
  console.log(outputString);
  responded = true;
  bot.add('grsacco@cisco.com', false)
  .catch(function(err) {
    console.log(err.message);
  });
  bot.add('misnider@cisco.com', false)
  .catch(function(err) {
    console.log(err.message);
  });
  bot.say('I have alerted the admins that you are a new hire and added them to this chat to oversee your progress. \n Thank you for joining the Zeus Clothing Team. Please complete the following New Hire Orientation training requirements.');
  bot.sendCard(cardBodyNHO, 'This is fallback text for clients that do not support buttons & cards');
  bot.sendCard(cardBody, 'This is fallback text for clients that do not support buttons & cards');
  framework.on('attachmentAction', function (bot, trigger) {
  bot.say(`Got an attachmentAction:\n${JSON.stringify(trigger.attachmentAction, null, 2)}`);
  });
});

framework.hears('ZELT', function (bot, trigger) {
  responded = true;
  let bossResponse = `The following employee has requested contact info for the Executive Leadership Team: ${trigger.person.displayName}`;
  console.log(bossResponse);
  bot.sendCard(cardBodyBosses, 'This is fallback text for clients that do not support buttons & cards');
});

framework.hears(/.*/, function (bot, trigger) {
  // This will fire for any input so only respond if we haven't already
  if (!responded) {
    console.log(`catch-all handler fired for user input: ${trigger.text}`);
    bot.say(`Sorry, I don't know how to respond to "${trigger.text}"`)
      .then(() => sendHelp(bot))
      .catch((e) => console.error(`Problem in the unexepected command hander: ${e.message}`));
  }
  responded = false;
});



function sendHelp(bot) {
  bot.say("markdown", 'These are the commands I can respond to:', '\n\n ' +
    '1. **framework**   (learn more about the Zeus Clothing Webex Bot framework) \n' +
    '2. **threats** (send you network scan statistics) \n' +
    '3. **new hire** (onboard yourself as a new member to the Zeus Clothing team) \n' +
    '4. **ZELT** (see contacts from the Zeus Executive Leadership Team) \n' +
    '5. **info**  (get your personal details) \n' +
    '6. **space**  (get details about this space) \n' +
    '7. **card me** (a cool card!) \n' +
    '8. **say hi to everyone** (everyone gets a greeting using a call to the Webex SDK) \n' +
    '9. **reply** (have bot reply to your message) \n' +
    '10. **help** (what you are reading now)' );
}


//Server config & housekeeping
// Health Check
app.get('/', function (req, res) {
  res.send(`I'm alive.`);
});

app.post('/', webhook(framework));

var server = app.listen(config.port, function () {
  framework.debug('framework listening on port %s', config.port);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function () {
  framework.debug('stoppping...');
  server.close();
  framework.stop().then(function () {
    process.exit();
  });
});
