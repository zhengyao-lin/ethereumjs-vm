import tape from 'tape'
import * as util from 'ethereumjs-util'
import { Transaction } from '@ethereumjs/tx'
import { Block } from '@ethereumjs/block'
import VM from '../../lib/index'

tape('VM events', (t) => {
  t.test('should emit the Block before running it', async (st) => {
    const vm = new VM()

    let emitted
    vm.on('beforeBlock', (val: any) => {
      emitted = val
    })

    const block = new Block()

    await vm.runBlock({
      block,
      generate: true,
      skipBlockValidation: true,
    })

    st.equal(emitted, block)

    st.end()
  })

  t.test('should emit a RunBlockResult after running a block', async (st) => {
    const vm = new VM()

    let emitted
    vm.on('afterBlock', (val: any) => {
      emitted = val
    })

    const block = new Block()

    await vm.runBlock({
      block,
      generate: true,
      skipBlockValidation: true,
    })

    st.deepEqual((emitted as any).receipts, [])
    st.deepEqual((emitted as any).results, [])

    st.end()
  })

  t.test('should the Transaction before running it', async (st) => {
    const vm = new VM()

    let emitted
    vm.on('beforeTx', (val: any) => {
      emitted = val
    })

    const tx = new Transaction({
      gasLimit: 200000,
      to: '0x1111111111111111111111111111111111111111',
    })
    tx.sign(util.toBuffer('0xa5737ecdc1b89ca0091647e727ba082ed8953f29182e94adc397210dda643b07'))
    await vm.runTx({ tx, skipBalance: true })

    st.equal(emitted, tx)

    st.end()
  })

  t.test('should emit RunTxResult after running a tx', async (st) => {
    const vm = new VM()

    let emitted: any
    vm.on('afterTx', (val: any) => {
      emitted = val
    })

    const tx = new Transaction({
      gasLimit: 200000,
      to: '0x1111111111111111111111111111111111111111',
      value: 1,
    })
    tx.sign(util.toBuffer('0xa5737ecdc1b89ca0091647e727ba082ed8953f29182e94adc397210dda643b07'))
    await vm.runTx({ tx, skipBalance: true })

    st.equal(util.bufferToHex(emitted.execResult.returnValue), '0x')

    st.end()
  })

  t.test('should emit the Message before running it', async (st) => {
    const vm = new VM()

    let emitted: any
    vm.on('beforeMessage', (val: any) => {
      emitted = val
    })

    const tx = new Transaction({
      gasLimit: 200000,
      to: '0x1111111111111111111111111111111111111111',
      value: 1,
    })
    tx.sign(util.toBuffer('0xa5737ecdc1b89ca0091647e727ba082ed8953f29182e94adc397210dda643b07'))
    await vm.runTx({ tx, skipBalance: true })

    st.equal(util.bufferToHex(emitted.to), '0x1111111111111111111111111111111111111111')
    st.equal(util.bufferToHex(emitted.code), '0x')

    st.end()
  })

  t.test('should emit EVMResult after running a message', async (st) => {
    const vm = new VM()

    let emitted: any
    vm.on('beforeMessage', (val: any) => {
      emitted = val
    })

    const tx = new Transaction({
      gasLimit: 200000,
      to: '0x1111111111111111111111111111111111111111',
      value: 1,
    })
    tx.sign(util.toBuffer('0xa5737ecdc1b89ca0091647e727ba082ed8953f29182e94adc397210dda643b07'))
    await vm.runTx({ tx, skipBalance: true })

    st.equal(util.bufferToHex(emitted.createdAddress), '0x')

    st.end()
  })

  t.test('should emit InterpreterStep on each step', async (st) => {
    const vm = new VM()

    let lastEmitted: any
    vm.on('step', (val: any) => {
      lastEmitted = val
    })

    // This a deployment transaction that pushes 0x41 (i.e. ascii A) followed by 31 0s to
    // the stack, stores that in memory, and then returns the first byte from memory.
    // This deploys a contract which a single byte of code, 0x41.
    const tx = new Transaction({
      gasLimit: 200000,
      data: '0x7f410000000000000000000000000000000000000000000000000000000000000060005260016000f3',
    })
    tx.sign(util.toBuffer('0xa5737ecdc1b89ca0091647e727ba082ed8953f29182e94adc397210dda643b07'))
    await vm.runTx({ tx, skipBalance: true })

    st.equal(lastEmitted.opcode.name, 'RETURN')

    st.end()
  })

  t.test('should emit a NewContractEvent on new contracts', async (st) => {
    const vm = new VM()

    let emitted: any
    vm.on('newContract', (val: any) => {
      emitted = val
    })

    // This a deployment transaction that pushes 0x41 (i.e. ascii A) followed by 31 0s to
    // the stack, stores that in memory, and then returns the first byte from memory.
    // This deploys a contract which a single byte of code, 0x41.
    const tx = new Transaction({
      gasLimit: 200000,
      data: '0x7f410000000000000000000000000000000000000000000000000000000000000060005260016000f3',
    })
    tx.sign(util.toBuffer('0xa5737ecdc1b89ca0091647e727ba082ed8953f29182e94adc397210dda643b07'))
    await vm.runTx({ tx, skipBalance: true })

    st.equal(
      util.bufferToHex(emitted.code),
      '0x7f410000000000000000000000000000000000000000000000000000000000000060005260016000f3',
    )

    st.end()
  })
})
