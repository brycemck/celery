<template>
  welcome {{ username }}
  <ChatWidget :twitchBot="twitchBot" />
</template>

<script setup>
  import { useUserStore } from '@/stores/userStore'
  import { storeToRefs } from 'pinia'
  
  const userStore = useUserStore()
  const { username, id, loggedIn, access_token } = storeToRefs(userStore)

  if (!access_token.value || access_token.value.length < 1) { // if no value in the cookie
    navigateTo('/login')
  }

  // sound setup
  let PlayingSound = false;

  // build twitch bot class
  class TwitchBot {
    constructor(twitchNick) {
      this.soundsPath = 'sounds'
      this.commandsPath = 'commands'
      this.twitchNick = twitchNick
      this.messagesToDisplay = reactive([])
    }
    handleWSSMessage(message) { // when there's a new message sent to the web socket server (localhost)
      const messageData = JSON.parse(message.data)
      // console.log('[handle wss message', message, ']');
      if (message.data[0] == ':') {
        // safe to ignore just info message
      } else {
        this.pushChatMessage(messageData)
        this.handleChatMessage(messageData)
      }
    }
    parseTags = (tags) => { // parse tags in message data
      // badge-info=;badges=broadcaster/1;color=#0000FF;...
      const tagsToIgnore = {  // List of tags to ignore.
        'client-nonce': null,
        'flags': null
      };
    
      let dictParsedTags = {};  // Holds the parsed list of tags.
          // The key is the tag's name (e.g., color).
      let parsedTags = tags.split(';'); 
    
      parsedTags.forEach(tag => {
        let parsedTag = tag.split('=');  // Tags are key/value pairs.
        let tagValue = (parsedTag[1] === '') ? null : parsedTag[1];
      
        switch (parsedTag[0]) {  // Switch on tag name
          case 'badges':
          case 'badge-info':
            // badges=staff/1,broadcaster/1,turbo/1;
        
            if (tagValue) {
              let dict = {};  // Holds the list of badge objects.
                // The key is the badge's name (e.g., subscriber).
              let badges = tagValue.split(','); 
              badges.forEach(pair => {
                let badgeParts = pair.split('/');
                dict[badgeParts[0]] = badgeParts[1];
              })
              dictParsedTags[parsedTag[0]] = dict;
            }
            else {
              dictParsedTags[parsedTag[0]] = null;
            }
            break;
          case 'emotes':
            // emotes=25:0-4,12-16/1902:6-10
            if (tagValue) {
              let dictEmotes = {};  // Holds a list of emote objects.
                // The key is the emote's ID.
              let emotes = tagValue.split('/');
              emotes.forEach(emote => {
                let emoteParts = emote.split(':');
            
                let textPositions = [];  // The list of position objects that identify
                    // the location of the emote in the chat message.
                let positions = emoteParts[1].split(',');
                positions.forEach(position => {
                  let positionParts = position.split('-');
                  textPositions.push({
                    startPosition: positionParts[0],
                    endPosition: positionParts[1]    
                  })
                });
                dictEmotes[emoteParts[0]] = textPositions;
              })
              dictParsedTags[parsedTag[0]] = dictEmotes;
            } else {
              dictParsedTags[parsedTag[0]] = null;
            }
            break;
          case 'emote-sets':
            // emote-sets=0,33,50,237
        
            let emoteSetIds = tagValue.split(',');  // Array of emote set IDs.
            dictParsedTags[parsedTag[0]] = emoteSetIds;
            break;
          default:
            // If the tag is in the list of tags to ignore, ignore
            // it; otherwise, add it.
            if (tagsToIgnore.hasOwnProperty(parsedTag[0])) { 

            } else {
              dictParsedTags[parsedTag[0]] = tagValue;
            }
            break;
        }
      });
      return dictParsedTags;
    }
    parseCommand = (rawCommandComponent) => { // parse command in message data
      let parsedCommand = null;
      let commandParts = rawCommandComponent.split(' ');
    
      switch (commandParts[0]) {
        case 'JOIN':
        case 'PART':
        case 'NOTICE':
        case 'CLEARCHAT':
        case 'HOSTTARGET':
        case 'PRIVMSG':
          parsedCommand = {
            command: commandParts[0],
            channel: commandParts[1]
          }
          break;
        case 'PING':
          parsedCommand = {
            command: commandParts[0]
          }
          break;
        case 'CAP':
          parsedCommand = {
            command: commandParts[0],
            isCapRequestEnabled: (commandParts[2] === 'ACK') ? true : false,
            // The parameters part of the messages contains the 
            // enabled capabilities.
          }
          break;
        case 'GLOBALUSERSTATE':  // Included only if you request the /commands capability.
            // But it has no meaning without also including the /tags capability.
          parsedCommand = {
            command: commandParts[0]
          }
          break;               
        case 'USERSTATE':   // Included only if you request the /commands capability.
        case 'ROOMSTATE':   // But it has no meaning without also including the /tags capabilities.
          parsedCommand = {
            command: commandParts[0],
            channel: commandParts[1]
          }
          break;
        case 'RECONNECT':  
          console.log('The Twitch IRC server is about to terminate the connection for maintenance.')
          parsedCommand = {
            command: commandParts[0]
          }
          break;
        case '421':
          console.log(`Unsupported IRC command: ${commandParts[2]}`)
          return null;
        case '001':  // Logged in (successfully authenticated). 
          parsedCommand = {
            command: commandParts[0],
            channel: commandParts[1]
          }
          break;
        case '002':  // Ignoring all other numeric messages.
        case '003':
        case '004':
        case '353':  // Tells you who else is in the chat room you're joining.
        case '366':
        case '372':
        case '375':
        case '376':
          // console.log(`numeric message: ${commandParts[0]}`)
          return null;
        default:
          console.log(`\nUnexpected command: ${commandParts[0]}\n`);
          return null;
      }
      return parsedCommand;
    }
    parseSource = (rawSourceComponent) => { // parse source in message data
      if (null == rawSourceComponent) {  // Not all messages contain a source
        return null;
      }
      else {
        let sourceParts = rawSourceComponent.split('!');
        return {
          nick: (sourceParts.length == 2) ? sourceParts[0] : null,
          host: (sourceParts.length == 2) ? sourceParts[1] : sourceParts[0]
        }
      }
    }
    parseParameters = (rawParametersComponent, command) => { // parse parameters in message data
      let idx = 0
      let commandParts = rawParametersComponent.slice(idx + 1).trim(); 
      let paramsIdx = commandParts.indexOf(' ');
    
      if (-1 == paramsIdx) { // no parameters
        command.botCommand = commandParts.slice(0); 
      }
      else {
        command.botCommand = commandParts.slice(0, paramsIdx); 
        command.botCommandParams = commandParts.slice(paramsIdx).trim();
        // TODO: remove extra spaces in parameters string
      }
    
      return command;
    }
    parseMessage = (message) => { // parse overall message data
      let parsedMessage = {  // Contains the component parts.
        tags: null,
        source: null,
        command: null,
        parameters: null
      };
    
      // The start index. Increments as we parse the IRC message.
    
      let idx = 0; 
    
      // The raw components of the IRC message.
    
      let rawTagsComponent = null;
      let rawSourceComponent = null; 
      let rawCommandComponent = null;
      let rawParametersComponent = null;
    
      // If the message includes tags, get the tags component of the IRC message.
    
      if (message[idx] === '@') {  // The message includes tags.
        let endIdx = message.indexOf(' ');
        rawTagsComponent = message.slice(1, endIdx);
        idx = endIdx + 1; // Should now point to source colon (:).
      }
    
      // Get the source component (nick and host) of the IRC message.
      // The idx should point to the source part; otherwise, it's a PING command.
    
      if (message[idx] === ':') {
        idx += 1;
        let endIdx = message.indexOf(' ', idx);
        rawSourceComponent = message.slice(idx, endIdx);
        idx = endIdx + 1;  // Should point to the command part of the message.
      }
    
      // Get the command component of the IRC message.
    
      let endIdx = message.indexOf(':', idx);  // Looking for the parameters part of the message.
      if (-1 == endIdx) {                      // But not all messages include the parameters part.
        endIdx = message.length;                 
      }
    
      rawCommandComponent = message.slice(idx, endIdx).trim();
    
      // Get the parameters component of the IRC message.
    
      if (endIdx != message.length) {  // Check if the IRC message contains a parameters component.
        idx = endIdx + 1;            // Should point to the parameters part of the message.
        rawParametersComponent = message.slice(idx);
      }
    
      // Parse the command component of the IRC message.
    
      parsedMessage.command = this.parseCommand(rawCommandComponent);
    
      // Only parse the rest of the components if it's a command
      // we care about; we ignore some messages.
    
      if (null == parsedMessage.command) {  // Is null if it's a message we don't care about.
        return null; 
      }
      else {
        if (rawTagsComponent != null) {  // The IRC message contains tags.
          parsedMessage.tags = this.parseTags(rawTagsComponent);
        }
      
        parsedMessage.source = this.parseSource(rawSourceComponent);
      
        parsedMessage.parameters = rawParametersComponent;
        if (rawParametersComponent && rawParametersComponent[0] === '!') {  
          // The user entered a bot command in the chat window.            
          parsedMessage.command = this.parseParameters(rawParametersComponent, parsedMessage.command);
        }
      }
    
      return parsedMessage;
    }
    pushChatMessage = (message) => { // push a new chat message to the ChatWidget component
      // parse badges
      // console.log('[gonna be a new chat message', message, ']')
      if (message.tags.badges) {
        message.tags.badgesList = []
        for (let key in message.tags.badges) {
          let keyName = '';
          // some keys need to be reworded to fit icon names and class names
          switch (key) {
            case 'moderator':
              keyName = 'moderator';
              break;
            case 'broadcaster':
              keyName = 'broadcaster';
              break;
            case 'turbo':
              keyName = 'turbo';
              break;
            case 'verified':
              keyName = 'verified';
              break;
            case 'vip':
              keyName = 'vip';
              break;
            case 'no_audio':
              keyName = 'no_audio';
              break;
            case 'no_video':
              keyName = 'no_video';
              break;
            case 'premium':
              keyName = 'prime';
              break;
            case 'artist-badge':
              keyName = 'artist'
              break;
            default:
          }
          message.tags.badgesList.push(keyName)
        }
      }

      // limit messages that can be displayed at once, remove the first message in the array of messages if at the limit
      if (this.messagesToDisplay.length == 15) this.messagesToDisplay.shift();
      this.messagesToDisplay.push(message);
      // console.log(this.messagesToDisplay)
    }
    handleChatMessage = async (message) => { // handle the chat message, check for command
      const that = this;
      if (message.parameters.startsWith('!')) { // message starts with ! so invoking command
        const args = message.parameters.slice(1).split(/ +/);
        const commandName = args.shift().toLowerCase();
    
        // If the command isn't in the command folder, move on
        const { data, pending, error, refresh } = await useFetch(`/api/commands/${commandName}`, {
          onResponse({ request, response, options }) {
            if(!response) return;
        
            if (response.args && !args.length) {
              let reply = 'That command requires more details!';
          
              // If we have details on how to use the args, provide them
              if (response.usage) {
                reply += `\nThe proper usage would be: \`!${command.name} ${command.usage}\``;
              }
          
              // Send a reply from the bot about any error encountered
              return that.sendChatMessage(reply);
            }
            
            try {
              // Run the command
              if (response._data.sound) {
                PlayingSound = true
              } else {
                const run = eval('(' + response._data.run + ')')
                run().then((message) => {
                  that.sendChatMessage(message)
                })
              }
            } catch(error) {
              that.sendChatMessage('There was an error running that! (common celery L)');
              return console.error(error);
            }
          }
        })
      }
    }
    sendChatMessage = (message) => {
      this.wssConnection.send(`PRIVMSG #${this.twitchNick} :${message}`)
    }
  }

  // initialize twitchbot, make it reactive
  const twitchBot = reactive(new TwitchBot('celerymanttv'))
  // provide twitchBot to child components
  provide('twitchBot', twitchBot)

  onMounted( function() {
    // connect as a client to the localhost web socket server (started in middleware)
    twitchBot.wssConnection = new WebSocket('ws://localhost:6969')
    twitchBot.wssConnection.onmessage = (message) => { // on web socket server message, send it to TwitchBot
      // console.log('[wssConnection onmessage', message, ']')
      twitchBot.handleWSSMessage(message)
    }
    twitchBot.wssConnection.onopen = function (event) {
      console.log('opened connection to wss')
    }
  })
</script>

<style scoped>
  h2 {
    font-size: 40px;
  }
</style>