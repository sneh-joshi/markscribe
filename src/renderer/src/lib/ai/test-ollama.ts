// Test script for Ollama provider
// Run this in the browser console to test the provider

import { OllamaProvider } from './providers/ollama'
import type { AIProvider } from './types'

async function testOllamaProvider() {
  console.log('🧪 Testing Ollama Provider...\n')

  const config: AIProvider = {
    name: 'Ollama Local',
    type: 'ollama',
    endpoint: 'http://localhost:11434',
    model: 'llama3.2'
  }

  const provider = new OllamaProvider(config)

  // Test 1: Connection
  console.log('1️⃣ Testing connection...')
  const isConnected = await provider.testConnection()
  console.log(`   ${isConnected ? '✅' : '❌'} Connection: ${isConnected}\n`)

  if (!isConnected) {
    console.error('❌ Ollama is not running. Start it with: ollama serve')
    return
  }

  // Test 2: List Models
  console.log('2️⃣ Listing available models...')
  const models = await provider.listModels()
  console.log(`   ✅ Found ${models.length} models:`)
  models.forEach((model) => console.log(`      - ${model}`))
  console.log()

  // Test 3: Simple Completion
  console.log('3️⃣ Testing simple completion...')
  const completion = await provider.complete({
    prompt: 'Complete this sentence: Markdown is a lightweight',
    maxTokens: 50,
    temperature: 0.7
  })
  console.log(`   ✅ Response: "${completion.text}"`)
  console.log(`   📊 Model: ${completion.model}\n`)

  // Test 4: Streaming Completion
  console.log('4️⃣ Testing streaming completion...')
  console.log('   📝 Streaming response: ')
  let streamedText = ''
  for await (const chunk of provider.streamComplete({
    prompt: 'Write three tips for better writing in markdown format',
    maxTokens: 150,
    temperature: 0.7
  })) {
    streamedText += chunk
    process.stdout.write(chunk)
  }
  console.log('\n   ✅ Streaming completed\n')

  console.log('✅ All tests passed!')
}

// Export for use in browser console or Node.js
export { testOllamaProvider }

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  console.log('Run testOllamaProvider() to test the Ollama provider')
}
