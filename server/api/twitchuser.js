import { useUserStore } from '@/stores/userStore'

export default defineEventHandler(async (event) => {
  const { twitchClientId } = useRuntimeConfig()

  const userStore = useUserStore()
  const { access_token } = userStore

  console.log(access_token)

  const { userId } = getQuery(event)

  // if ( !userId ) return;

  const userData = await $fetch('https://api.twitch.tv/helix/users', {
    method: 'get',
    query: {
      name: 'celerymanttv'
    },
    headers: {
      'Authorization': `Bearer ${access_token.value}`,
      'Client-Id': twitchClientId
    }
  })
  
  return userData.data[0];
})