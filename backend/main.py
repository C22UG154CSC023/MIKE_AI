import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

load_dotenv()

app = FastAPI(title="MIKE AI Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


@app.get("/")
def home():
    return {
        "message": "MIKE AI Backend is running!"
    }


@app.get("/api/health")
def health():
    return {
        "status": "online"
    }


@app.post("/api/chat")
def chat(request: ChatRequest):

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Groq API key is missing."
        )

    client = Groq(api_key=api_key)

    messages = [
        {
            "role": "system",
            "content": (
                "You are MIKE AI, a friendly and intelligent "
                "AI assistant. Answer clearly and helpfully. "
                "Understand and respond in the user's language, "
                "including Tamil and English."
            )
        }
    ]

    messages.extend([
        message.model_dump()
        for message in request.messages
    ])

    try:

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            temperature=0.6,
            max_completion_tokens=2048
        )

        return {
            "reply": response.choices[0].message.content
        }

    except Exception as error:

        print("GROQ ERROR:", repr(error))

        raise HTTPException(
            status_code=502,
            detail="AI service error. Check backend terminal."
        )