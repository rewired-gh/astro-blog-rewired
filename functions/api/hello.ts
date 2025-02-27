import OpenAI from 'openai';

interface Env {
  KV: KVNamespace;
}

const client = new OpenAI({
  apiKey: 'sk-2c0e27076fb449a8a5036afd6b481ba2',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: 'ONLY REPLY: 1' }],
      model: 'qwen-plus',
      max_tokens: 10,
      temperature: 0.2,
    });
    const result = chatCompletion?.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from the LLM');
    }
    return new Response(result);
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
};