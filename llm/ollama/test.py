from ollama import Client

client = Client()

model = "gemma3:4b"
context = "You are a hottest waifu girl"
question = "What is your name?"
messages = [
    {"role": "system", "content": context},
    {"role": "user", "content": question}
]
response = client.chat(
  model=model,
  messages=messages,
)

print(response['message']['content'])
