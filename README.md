# @kscript/json-pack
A simple JSON packer/unpacker

# example

``` javascript
const jsonPack = require('@kscript/json-pack');
const user = {
  a: 1,
  aa: 11,
  aaa: 111,
  aaaa: {
    b: 2,
    bb: 22,
    bbb: 222,
    bbbb: {
      a: 3,
      aa: 33,
      aa: 333
    }
  },
  d: [
    {
      a: 1,
      d: 4
    },
    {
      aa: 11,
      dd: 44
    },
    {
      aaa: 111,
      ddd: 444
    },
    {
      aaaa: 1111,
      dddd: 4444
    },
    {
      aaaa: 1111,
      dddd: 4444
    },
    {
      aaaa: 1111,
      dddd: 4444
    }
  ]
}
// keys的引用不会丢失, 可以是一个公共的key数组, 用于多文件压缩
// 单文件压缩时, keys会一起压缩, 每个文件都可以直接解压
// 多文件压缩时, keys是公共的, 动态增加的, 需要自行保存好
const options = { keys: [] }
console.log([
  // 压缩
  jsonPack.compress(user),
  // 压缩 + 解压
  // 压缩时不传keys数组, 返回压缩后的content
  // 传入keys数组, 返回的是[content, options]数组(与解压函数的参数一一对应)
  jsonPack.decompress(...jsonPack.compress(user, options))
])
```