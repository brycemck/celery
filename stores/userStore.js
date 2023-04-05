import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  let loggedIn = ref(false)
  let username = ref('')
  let id = ref(0)
  let access_token = ref('')

  function setUserInfo(userData) {
    id.value = userData.id
    username.value = userData.display_name
  }
  function setAccessToken(accessToken) {
    access_token.value = accessToken
  }

  return { loggedIn, username, id, access_token, setUserInfo, setAccessToken }
}, {
  persist: true
})