import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  let loggedIn = ref(false)
  let username = ref('')
  let id = ref('')
  let access_token = ref('')
  let channelDescription = ref('')
  let profileImageUrl = ref('')

  function setUserInfo(userData) {
    console.log(userData)
    id.value = userData.id
    username.value = userData.display_name
    channelDescription.value = userData.description
    profileImageUrl.value = userData.profile_image_url
  }
  function setAccessToken(accessToken) {
    access_token.value = accessToken
  }

  return { loggedIn, username, id, access_token, setUserInfo, setAccessToken }
}, {
  persist: true
})