'use strict'
const t = require('tap')
const fs = require('fs')
const path = require('path')
const walk = require('..')
const Walker = walk.Walker
const WalkerSync = walk.WalkerSync
const mutateFS = require('mutate-fs')

require('./common.js').ignores({
  '.ignore': ['*', '!d/c/h/.dch', '!/h/c/d/hcd'],
})

t.test('error only emits once', t => {
  const poop = new Error('poop')
  poop.stack += ''
  t.teardown(mutateFS.statFail(poop))

  t.test('async', t => {
    let sawError = false
    const w = new Walker({ path: __dirname }).start()
    w.on('error', er => {
      t.equal(er, poop)
      if (sawError) {
        throw er
      }
      sawError = true
      w.emit('error', new Error('not poop'))
      t.end()
    })
  })

  t.test('sync', t => {
    t.throws(() => new WalkerSync({ path: __dirname }).start(), poop)
    t.end()
  })

  t.end()
})

t.test('readdir error', t => {
  const poop = new Error('poop')
  poop.stack += ''
  t.teardown(mutateFS.fail('readdir', poop))

  t.test('async', t => {
    new Walker({}).on('error', er => {
      t.equal(er, poop)
      t.end()
    }).start()
  })

  t.test('sync', t => {
    t.throws(() => new WalkerSync().start(), poop)
    t.end()
  })

  t.end()
})

t.test('synchronous throw in readdir callback is emitted as error', t => {
  const dir = path.resolve(__dirname, 'fixtures/empty-throw')
  fs.mkdirSync(dir, { recursive: true })
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))

  const boom = new Error('boom from done listener')
  const w = new Walker({ path: dir })
  let threw = false
  w.on('done', () => {
    if (!threw) {
      threw = true
      throw boom
    }
  })
  w.on('error', er => {
    t.equal(er, boom)
    t.end()
  })
  w.start()
})

t.test('readFile error', t => {
  const poop = new Error('poop')
  t.teardown(mutateFS.fail('readFile', poop))

  t.test('async', t => {
    new Walker().on('error', er => {
      t.equal(er, poop)
      t.end()
    }).start()
  })

  t.test('sync', t => {
    t.throws(() => new WalkerSync().start(), poop)
    t.end()
  })

  t.end()
})
