/** ワンコメ側の設定 */
const JSON_PATH = '../../comment.json'
/** ワンコメ側の設定 */
const COMMENT_LIMIT = 30

/** コメントの 1文字が表示されてから次の文字が表示されるまでの時間 単位ms */
const TYPING_INTERVAL = 100
/** コメントが表示されてから最初の文字が表示されるまでの時間 単位ms */
const TYPING_DELAY = 200

/**
 * @param {String} html 1回のタイプで表示したい html
 * @param {number} index 何文字目にタイプするか (ディレイの時間調整に使用)
 * @returns {String}
 */
const htmlToTypeChar = (html, index) => {
  const delayMiliSecond = index * TYPING_INTERVAL+TYPING_DELAY
  return `<div class='char' style='animation-delay:${delayMiliSecond}ms'>${html}</div>`
}

/**
 * @param {String} comment コメントの文字列 (絵文字が img タグで混入している)
 * @returns タイピングアニメーションを付与した comment
 */
const attachTypingAnim = (comment) => {
  console.log(comment)
  const specialTokenReg = /(<img [^<>]+>)|(&lt;)|(&gt;)|(&amp;)/g
  const specialTokens = [...comment.matchAll(specialTokenReg)]
  const placeHolderToken = '\t'
  comment = comment.replaceAll(specialTokenReg, placeHolderToken)

  comment = Array.prototype.map.call(comment, htmlToTypeChar).join('')

  specialTokens.forEach((value) => {
    comment = comment.replace(placeHolderToken, value[0])
  })

  return comment;
}

const app = Vue.createApp({
  setup() {
    document.body.removeAttribute('hidden')
  },
  data () {
    return {
      comments: []
    }
  },
  methods: {
    getClassName(comment) {
      if (comment.commentIndex % 2 === 0) {
        return 'comment even'
      }
      return 'comment odd'
    },
    getStyle(comment) {
      if (comment.service === 'youtube' && comment.data.colors) {
        const style = {
          '--lcv-background-color': comment.data.colors.bodyBackgroundColor,
          '--lcv-text-color': comment.data.colors.bodyTextColor,
          '--lcv-comment-shadow': 'none'
        }
        return style
      }
      if (comment.service === 'bilibili' && comment.data.colors) {
        const style = {
          '--lcv-background-color': comment.data.colors.backgroundBottomColor,
          '--lcv-text-color': comment.data.colors.messageFontColor,
          '--lcv-comment-shadow': 'none'
        }
        return style
      }
    }
  },
  mounted () {
    let cache = new Map()
    commentIndex = 0
    OneSDK.setup({
      jsonPath: JSON_PATH,
      commentLimit: COMMENT_LIMIT
    })
    OneSDK.subscribe({
      action: 'comments',
      callback: (comments) => {
        const newCache = new Map()
        comments.forEach(comment => {
          const index = cache.get(comment.data.id)
          if (isNaN(index)) {
            comment.commentIndex = commentIndex
            newCache.set(comment.data.id, commentIndex)
            ++commentIndex
            comment.data.comment = attachTypingAnim(comment.data.comment)
          } else {
            comment.commentIndex = index
            newCache.set(comment.data.id, index)
          }
        })
        cache = newCache
        this.comments = comments
      }
    })
    OneSDK.connect()
  },
})
OneSDK.ready().then(() => {
  app.mount("#container");
})
