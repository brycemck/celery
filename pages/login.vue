<template>
  <h2>login</h2>
  <a :href="twitchAuthorization.getOauthRequestUrl()">Login to Twitch</a>
</template>

<script setup>
  import { useUserStore } from '@/stores/userStore'
  import { storeToRefs } from 'pinia'

  // use runtime config for env variables
  const { twitchClientId } = useRuntimeConfig()

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

  const userStore = useUserStore()
  // console.log('logging user store')
  // console.log(userStore)
  const { access_token } = storeToRefs(userStore)
  const { setUserInfo, setAccessToken } = userStore

  const hash = useRoute().hash;

  if (access_token.value !== undefined && access_token.value.length > 0) { // cookie is already set
    navigateTo('/') // go back home
    console.log('access token set in store')
  } else if (hash) { // if there's a hash
    console.log('there is a hash')
    const params = new URLSearchParams(hash.replace('#', '?'))
    const accessToken = params.get('access_token')
    setAccessToken(accessToken)

    await useFetch('/api/twitchuser', {
      query: {
        accessToken: accessToken
      },
      onResponse({request, response, options}) {
        setUserInfo(response._data)
        // console.log(response)
      }
    });
    navigateTo('/') // go back home
  } else { // fresh login
    console.log('no access token set in store and not calledback')
  }
</script>