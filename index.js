const keywords = {
  'A': '""',
  'B': '{}',
  'C': '[]',
  'D': 'true',
  'E': 'false'
}
const UUID = () => ((UUID.index = (UUID.index || 0) + 1) + Math.random().toString(36).slice(2)) + Date.now()
/**
 * 压缩
 * @param {Object} data 要压缩的数据
 * @param {Object=} options 压缩选项
 *  @property {String=} options.split 分割符
 *  @property {Array=} options.keys 压缩时使用的key列表
 * @returns 如果传入了keys参数, 则返回供解压函数的参数数组, 否则返回压缩后的keys与数据
 */
const compress = (data, options = {}) => {
  const { split = '\n', small = false, keys } = options
  const state = {
    map: {}, length: 0
  }
  if (Array.isArray(keys)) {
    keys.forEach(key => {
      state.map[key] = state.length++
    })
  }
  const core = (data) => {
    if (Array.isArray(data)) {
      return data.map(item => core(item))
    } else
    if (data instanceof Object) {
      const contents = {}
      const reg = new RegExp(split)
      Object.keys(data).forEach((key) => {
        const value = data[key]
        const result = value instanceof Object ? core(value) : value
        if (reg.test(key)) {
          console.warn(`存在带有分隔符 ${split} 的键, 将导致键名无法还原`)
        } else
        if (key.length >= 1 && key.length <= 2) {
          if (small && 0) {
            contents[key + ':'] = result
            return
          }
        }
        state.map[key] = typeof state.map[key] === 'number' ? state.map[key] : state.length++
        contents[state.map[key]] = result
      })
      return contents
    }
    return data
  }
  const stringify = (data) => JSON.stringify(core(data))
  const format = (data) => {
    const map = Object.keys(keywords)
      .reduce((map, key) => {
        map[keywords[key]] = key
        return map
      }, {})
    data = typeof data === 'string' ? data : ''
     data = data.replace(/([^\\]|)"(\d+)([^\\]|)":/g, (s, s1, s2) => s1 + (+s2 + 360).toString(36))
    // 压缩可以匹配到map的值
    data = data.replace(/(\,|\{)([a-z][a-z0-9])(""|\[\]|\{\}|false|true)/g, (s, s1, s2, s3) => s1 + s2 + (map[s3] || ''))
    if (small) {
      // 压缩key长度在1~2, 以及可以匹配map的值
      data = data.replace(/(\,|\{)"(.{1,2}):":(""|\[\]|\{\}|false|true|)/g, (s, s1, s2 , s3) => s1 + s2 + ':' + (map[s3] || ''))
    }
    return data
  }
  const getKeys = (map = state.map) => Object.keys(map)
    .reduce((list, key) => {
      list[map[key]] = key
      return list
    }, [])
  const getContent = (context = data) => format(stringify(context))
  const content = getContent()
  if (keys) {
    keys.splice(0, keys.length, ...getKeys())
    return [content, options]
  }
  return getKeys().join() + split + content
}
/**
 * 解压
 * @param {String} content 压缩后的内容
 * @param {Object=} options 解压选项
 *  @property {String=} options.split 分割符
 *  @property {Array=} options.keys 压缩时使用的key列表
 * @returns {Object} 解压后的数据
 */
const decompress = (content, options = {}) => {
  const { split = '\n', small = false } = options
  const contents = {}
  const list = content.split(split)
  const hasKeys = Array.isArray(options.keys)
  const keys = hasKeys ? options.keys : list[0].split(',')
  const rest = hasKeys ? list : list.slice(1)
  const keyMap = keys
    .reduce((map, item, index) => {
      map[index + 360] = item
      return map
    }, {})
  const core = (data) => {
    const map = Object.assign({}, keywords)
    data = data.replace(/([^\\]|)\"((.|\n)*?)([^\\]|)\"/g, (s, s1) => {
      const uuid = UUID() + s.length
      contents[uuid] = s.slice(1)
      return `${s1}<pack>${uuid}</pack>`
    })
    // 处理1~2长度的key, 因为有些情况没有覆盖到, 暂时不处理
    if (small && 0) {
      const replace = (s, s1, s2, s3, s4) => {
        const v2 = s4 === ':' ? s2 : keyMap[parseInt(s2, 36)]
        return `${s1}"${v2}"${s4 === ':' ? '' : ':'}${map[s3[0]] || ''}${s4}`
      }
      data = data.replace(/(\,|\{)(.{1,2})([A-E]|)(.)/g, replace)
      data = data.replace(/(\,|\{)(.{1,2})([A-E]|)([:\}\[\]])/g, replace)
    }
    // 下面的正则因为有重复消耗, 所以要调用两次
    // 尝试过使用 exec 然后改正则索引, 但可能是每次都做全量替换的缘故, 性能比较差
    const replace = (data) => data.replace(/(\,|\{)([a-z][a-z0-9])[^:]/g, (s, s1, s2) => `${s1}"${keyMap[parseInt(s2, 36)]}":${map[s.slice(-1)] || s.slice(-1)}`)
    data = replace(replace(data))
    data = data.replace(/<pack>([a-z0-9]+)<\/pack>/g, (s, s1) => contents[s1])
    return data
  }
  const result = core(rest.join(split))
  try {
    return JSON.parse(result)
  } catch (err) {
    console.error(err)
  }
  return {}
}

module.exports = { compress, decompress }
