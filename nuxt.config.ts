// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    twitchClientId: '',
    public: {
      twitchNick: ''
    }
  },
  css: [ '@/assets/styles/main.scss' ]
})
