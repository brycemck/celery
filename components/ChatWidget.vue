<!-- TODO -->
<!--
  - add support for 7TV and BTTV
  - test what happens when mod removes a message or clears chat
  - theme support? (black vs white text color)
-->

<template>
  <aside>
    <p v-for="(message, x) in twitchBot.messagesToDisplay" :key="x">
      <span v-if="message.tags.badgesList" class="badges">
        <span v-for="badge in message.tags.badgesList" :key="badge" class="badge" :class="badge+'-badge'"></span>
      </span>
      <span class="chatter-name" :style="'color: '+ message.tags.color +';'">{{ message.tags['display-name'] }}</span>
      <span class="chat-content" v-html="message.parameters"></span>
    </p>
  </aside>
</template>

<script setup>
  defineProps({ // define twitchBot as a prop to this component
    twitchBot: {
      type: Object,
      required: true
    },
  })
  // expose the twitchBot provided by parent via inject
  const twitchBot = inject('twitchBot')
</script>

<style scoped>
  aside {
    width: 400px;
    padding: 15px;
    font-size: 13px;
    line-height: 20px;
    white-space: nowrap;
    overflow-x: hidden;
  }
  p {
    margin: 3px 0;
  }
  .badges {
    display: inline-block;
    height: 16px;
  }
  .badge {
    position: relative;
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 3px;
    top: 3px;
    background-repeat: no-repeat;
    background-size: cover;
  }
  .badge:last-child {
    margin-right: 5px;
  }
  .chatter-name {
    position: relative;
    font-weight: 900;
    padding-right: 7px;
    font-size: 17px;
    top: 1px;
  }
  .chat-content {
    position: relative;
    top: -1px;
  }
</style>