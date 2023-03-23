<template>
    <h2>login</h2>
    <a :href="twitchAuthorization.getOauthRequestUrl()">Login to Twitch</a>
</template>

<script setup>
// use runtime config for env variables
const { twitchClientId } = useRuntimeConfig()
// get the access_token cookie
const accessTokenCookie = useCookie('access_token')

// build the Oauth request for Twitch to get a user access token
class TwitchOauth {
    constructor(clientId, redirectUri, scopes) {
        this.baseUrl = 'https://id.twitch.tv/oauth2/authorize';
        this.redirectUri = redirectUri;
        this.scopes = scopes;
        this.clientId = clientId;
    }
    getOauthRequestUrl() {
        return `${this.baseUrl}?response_type=token&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${this.scopes.join('+').replace(':', '%3A')}`
    }
}

const scopes = [
    'chat:read',
    'chat:edit',
    'channel:read:subscriptions',
    'channel:read:redemptions',
    'channel:read:polls',
    'channel:read:predictions',
    'channel:read:goals',
    'moderator:read:shoutouts'
];
const redirectUri = 'http://localhost:3000/login?response=true';
let twitchAuthorization = new TwitchOauth(twitchClientId, redirectUri, scopes);

const hash = useRoute().hash;

if (accessTokenCookie.value !== undefined && accessTokenCookie.value.length > 0) { // cookie is already set
    navigateTo('/') // go back home
} else if (hash) { // if there's a hash
    const params = new URLSearchParams(hash.replace('#', '?'))
    accessTokenCookie.value = params.get('access_token');
    navigateTo('/') // go back home
} else { // fresh login
    
}
</script>