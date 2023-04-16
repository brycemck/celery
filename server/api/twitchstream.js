export default defineEventHandler(async (event) => {
  const { twitchClientId } = useRuntimeConfig()
  const { accessToken } = getQuery(event)

  const streamData = await $fetch('https://api.twitch.tv/helix/streams', {
    query: {
      'user_login': 'celerymanttv'
    },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': twitchClientId
    }
  })

  return streamData.data[0]
})