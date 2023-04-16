export default defineEventHandler(async (event) => {
  const { twitchClientId } = useRuntimeConfig()

  const { userId, accessToken } = getQuery(event)

  // if ( !userId ) return;

  // console.log(accessToken)

  const userData = await $fetch('https://api.twitch.tv/helix/users', {
    method: 'get',
    query: {
      name: 'celerymanttv'
    },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': twitchClientId
    }
  })
  
  return userData.data[0];
})