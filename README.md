# CELERY
Welcome to Celery. Built in Nuxt 3, this app's purpose is to connect to and act on Twitch chat and channel events, as well as generate front-end pages that can be used as browser overlays / configuration pages.

## Prerequisites
This project uses Node 18.15.0. The latest stable version at the time of this writing is 19.x, however Nuxt 3 has not been updated to support Node 19. To make it easy, I highly recommend you use nvm, and set the project's working node version to 18.15.0.

It's also recommended that you install the basic Vue extensions in VSCode (or whichever text editor you are using) to get syntax highlighting on you

## Get started
If you want to get this project running locally, all you have to do is clone the repo, and then in a terminal window, navigate to the project directory and run the following:

```bash
npm install
```

You'll also need to create a .env file at the root of the project. Variables need to be prefixed with `NUXT_` for them to be able to be accessed via Nuxt. `NUXT_PUBLIC_` variables are exposed to the front-end, so don't mark anything secret with that prefix.
```
# client ID from Twitch developer application that you create
NUXT_TWITCH_CLIENT_ID=
# lowercase version of whatever Twitch username you are building this for
NUXT_PUBLIC_TWITCH_NICK=
```

That's it! You should be able to access the build at http://localhost:3000.

## Links
For more documentation and information about Nuxt, you can read their documentation [here](https://nuxt.com/docs/getting-started/introduction).

## Middleware
This app uses server middleware to start a web socket server that the client can connect to (/server/middleware/websocket.js). The WebSocketServer object is not made accessible to the client, but rather the client connects to it using the browser's built-in WebSocket API.