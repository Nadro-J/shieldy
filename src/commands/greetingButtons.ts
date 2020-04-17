// Dependencies
import { Telegraf, ContextMessageUpdate, Extra } from 'telegraf'
import { strings, localizations } from '../helpers/strings'
import { checkLock } from '../middlewares/checkLock'
import { report } from '../helpers/report'
import { ExtraReplyMessage } from 'telegraf/typings/telegram-types'

export function setupGreetingButtons(bot: Telegraf<ContextMessageUpdate>) {
  // Setup command
  bot.command('greetingButtons', checkLock, async (ctx) => {
    let chat = ctx.dbchat
    chat.greetsUsers = !chat.greetsUsers
    chat = await chat.save()
    await ctx.replyWithMarkdown(
      `${strings(ctx.dbchat, 'greetingButtons')}`,
      Extra.inReplyTo(ctx.message.message_id).webPreview(false)
    )
    await ctx.replyWithMarkdown(
      ctx.dbchat.greetingButtons || strings(ctx.dbchat, 'greetingButtonsEmpty'),
      Extra.webPreview(false)
    )
  })
  // Setup checker
  bot.use(async (ctx, next) => {
    try {
      // Check if reply
      if (!ctx.message || !ctx.message.reply_to_message) {
        return
      }
      // Check if text
      if (!ctx.message.text) {
        return
      }
      // Check if reply to shieldy
      if (
        !ctx.message.reply_to_message.from ||
        !ctx.message.reply_to_message.from.username ||
        ctx.message.reply_to_message.from.username !==
          (bot as any).options.username
      ) {
        return
      }
      // Check if reply to the correct message
      const greetingButtonsMessages = Object.keys(
        localizations.greetingButtons
      ).map((k) => localizations.greetingButtons[k])
      if (
        !ctx.message.reply_to_message.text ||
        greetingButtonsMessages.indexOf(ctx.message.reply_to_message.text) < 0
      ) {
        return
      }
      // Check format
      const components = ctx.message.text.split('\n')
      let result = []
      for (const component of components) {
        const parts = component.split(' - ')
        if (parts.length !== 2) {
          // Default
          ctx.dbchat.greetingButtons = undefined
          await ctx.dbchat.save()
          return
        } else {
          result.push(component)
        }
      }
      // Save text
      ctx.dbchat.greetingButtons = result.join('\n')
      await ctx.dbchat.save()
      ctx.reply(
        strings(ctx.dbchat, 'greetsUsers_message_accepted'),
        Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage
      )
    } catch (err) {
      report(err)
    } finally {
      next()
    }
  })
}