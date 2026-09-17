from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import requests
import tempfile
import os

app = FastAPI()

print("Loading Whisper model...")

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)

ESP32 = "http://192.168.4.1"

print("Whisper loaded!")
print("Voice server ready!")


@app.post("/voice")
async def voice(file: UploadFile = File(...)):

    # Save audio temporarily
    suffix = os.path.splitext(file.filename or ".webm")[1]

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as f:

        f.write(await file.read())
        audio_path = f.name

    try:

        # Convert speech → text
        segments, info = model.transcribe(
            audio_path,
            language="en"
        )

        text = " ".join(
            segment.text for segment in segments
        ).lower().strip()

        print("Heard:", text)

        # Detect command
        command = None

        if "forward" in text or "go ahead" in text:
            command = "forward"

        elif (
            "backward" in text
            or "back" in text
            or "reverse" in text
        ):
            command = "backward"

        elif "left" in text:
            command = "left"

        elif "right" in text:
            command = "right"

        elif (
            "stop" in text
            or "halt" in text
        ):
            command = "stop"

        # Send command to ESP32
        if command:

            print("Command:", command)

            requests.get(
                f"{ESP32}/{command}",
                timeout=2
            )

        else:
            print("Unknown command")

        return {
            "text": text,
            "command": command
        }

    finally:

        os.remove(audio_path)