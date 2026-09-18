from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import requests
import tempfile
import os

app = FastAPI()


# =========================================
# ESP32
# =========================================

ESP32 = "http://172.20.10.2"


# =========================================
# WHISPER
# =========================================

print("Loading Whisper model...")

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)

print("Whisper loaded!")
print("Voice server ready!")


# =========================================
# ROVER CONTROL
# =========================================

@app.get("/rover/{command}")
async def rover_command(command: str):

    allowed_commands = [
        "forward",
        "backward",
        "left",
        "right",
        "stop"
    ]

    # Check command
    if command not in allowed_commands:

        return {
            "success": False,
            "message": "Invalid command"
        }

    try:

        response = requests.get(
            f"{ESP32}/{command}",
            timeout=2
        )

        print("Rover command:", command)

        return {
            "success": True,
            "command": command,
            "esp32_response": response.text
        }

    except Exception as e:

        print("ESP32 error:", e)

        return {
            "success": False,
            "message": str(e)
        }


# =========================================
# VOICE CONTROL
# =========================================

@app.post("/voice")
async def voice(file: UploadFile = File(...)):

    suffix = os.path.splitext(
        file.filename or ".webm"
    )[1]

    # Create temporary audio file
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix
    ) as f:

        f.write(await file.read())

        audio_path = f.name


    try:

        # =====================================
        # WHISPER TRANSCRIPTION
        # =====================================

        segments, info = model.transcribe(
            audio_path,
            language="en"
        )

        text = " ".join(
            segment.text
            for segment in segments
        ).lower().strip()


        print("Heard:", text)


        # =====================================
        # COMMAND DETECTION
        # =====================================

        command = None


        if (
            "forward" in text
            or "go ahead" in text
        ):

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


        # =====================================
        # SEND COMMAND TO ESP32
        # =====================================

        if command:

            print("Command:", command)

            try:

                response = requests.get(
                    f"{ESP32}/{command}",
                    timeout=2
                )

                print(
                    "ESP32:",
                    response.text
                )

            except Exception as e:

                print(
                    "ESP32 error:",
                    e
                )


        else:

            print("Unknown command")


        # =====================================
        # RESPONSE
        # =====================================

        return {

            "text": text,

            "command": command

        }


    finally:

        # Delete temporary audio file

        if os.path.exists(audio_path):

            os.remove(audio_path)