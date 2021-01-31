const {createEventAdapter} = require('@slack/events-api')
const {WebClient} = require('@slack/web-api')
const express = require('express')

const events = createEventAdapter(process.env.SLACK_SIGNING_SECRET)
const web = new WebClient(process.env.SLACK_TOKEN)
const port = process.env.PORT || 8080
const app = express();

const main = () => {
  events.on('message', messageHandler)
  events.on('app_mention', mentionHandler)
  events.on('error', console.error)

  app.use('/slack', events.expressMiddleware());
  app.use('/', (_, res) => res.send('🥉'))
  app.listen(port, () => console.log('started', {port}))
}

const messageHandler = async event => {
  console.log(JSON.stringify(event));

  const quotedText = textOnly(event)

  const plainText = noQuotes(quotedText)

  const matches = isJson(plainText)

  if (event.channel_type === 'im') {
    const reaction = matches
      ? 'thumbsup'
      : 'thumbsdown'

    await reactTo(event, reaction)
  } else if (matches) {
    const reaction = 'json'

    await reactTo(event, reaction)
  }
}

const mentionHandler = async event => {
  console.log(JSON.stringify(event));

  const quotedText = textOnly(event)

  const plainText = noQuotes(quotedText)

  const reaction = isJson(plainText)
    ? 'thumbsup'
    : 'thumbsdown'

  await reactTo(event, reaction)
}

const textOnly = event =>
  event.blocks
    .filter(elm => elm.type === 'rich_text')
    .flatMap(elm => elm.elements)
    .filter(elm => elm.type === 'rich_text_section')
    .flatMap(elm => elm.elements)
    .filter(elm => elm.type === 'text')
    .map(elm => elm.text)
    .join('')

const noQuotes = text => {
  text = onlyTextBetween(text, '```')
  text = onlyTextBetween(text, '`')

  return text
}

const isJson = (text) => {
  try {
    JSON.parse(text)

    return true
  } catch (_) {
    return false
  }
}

const reactTo = async (sourceEvent, reaction) => {
  try {
    await web.reactions.add({
      channel: sourceEvent.channel,
      name: reaction,
      timestamp: sourceEvent.ts,
    })
  } catch (err) {
    console.error('reactions-add failed', JSON.stringify(err))
  }
}

const onlyTextBetween = (text, delim) => {
  if (!startsAndEndsWith(text, delim)) return text

  return text.substr(delim.length, text.length - (delim.length * 2))
}

const startsAndEndsWith = (text, delim) => {
  if (text.length < (delim.length * 2)) return false

  return text.startsWith(delim) && text.endsWith(delim)
}

main()
