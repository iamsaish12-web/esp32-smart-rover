```jsx
import { useState } from "react";
import "./App.css";

// Local:
// /api/...    -> Vite proxy -> ESP32
// /voice      -> Vite proxy -> FastAPI
//
// Vercel:
// /rover/...  -> Cloudflare -> FastAPI -> ESP32
// /voice      -> Cloudflare -> FastAPI

const CLOUD_API =
  "https://otherwise-home-intensive-paul.trycloudflare.com";

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

async function sendRoverCommand(cmd) {
  const url = isLocal
    ? `/api/${cmd}`
    : `${CLOUD_API}/rover/${cmd}`;

  return fetch(url);
}

function App() {
  const [mode, setMode] = useState("manual");
  const [status, setStatus] = useState("READY");
  const [command, setCommand] = useState("STOP");
  const [listening, setListening] = useState(false);

  async function sendCommand(cmd) {
    try {
      setStatus("CONNECTING...");

      const response = await sendRoverCommand(cmd);
      const data = await response.json();

      if (
        response.ok &&
        (isLocal || data.success)
      ) {
        setCommand(cmd.toUpperCase());
        setStatus("CONNECTED");
      } else {
        setStatus("ESP32 ERROR");
      }

    } catch (error) {
      console.error(error);
      setStatus("ESP32 OFFLINE");
    }
  }

  function manualCommand(cmd) {
    sendCommand(cmd);
  }

  async function startVoice() {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        stream
          .getTracks()
          .forEach((track) => track.stop());

        setListening(false);
        setStatus("PROCESSING...");

        const audioBlob = new Blob(
          audioChunks,
          {
            type: "audio/webm",
          }
        );

        const formData = new FormData();

        formData.append(
          "file",
          audioBlob,
          "voice.webm"
        );

        try {
          const voiceURL = isLocal
            ? "/voice"
            : `${CLOUD_API}/voice`;

          const response = await fetch(
            voiceURL,
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await response.json();

          console.log(
            "Whisper result:",
            data
          );

          if (data.command) {
            setCommand(
              data.command.toUpperCase()
            );

            setStatus("CONNECTED");
          } else {
            setCommand(
              data.text || "NO SPEECH"
            );

            setStatus("UNKNOWN COMMAND");
          }

        } catch (error) {
          console.error(error);
          setStatus("VOICE SERVER ERROR");
        }
      };

      recorder.start();

      setListening(true);
      setStatus("LISTENING...");

      setTimeout(() => {
        recorder.stop();
      }, 3000);

    } catch (error) {
      console.error(error);

      setListening(false);
      setStatus("MICROPHONE ERROR");
    }
  }

  return (
    <div className="app">

      <header className="header">

        <div>
          <h1>ESP32 ROVER</h1>
          <p>SMART CONTROL SYSTEM</p>
        </div>

        <div className="status">
          <span></span>
          {status}
        </div>

      </header>


      <section className="mode">

        <h2>CONTROL MODE</h2>

        <div className="modeButtons">

          <button
            className={
              mode === "manual"
                ? "active"
                : ""
            }
            onClick={() =>
              setMode("manual")
            }
          >
            MANUAL
          </button>

          <button
            className={
              mode === "voice"
                ? "active"
                : ""
            }
            onClick={() =>
              setMode("voice")
            }
          >
            VOICE
          </button>

        </div>

      </section>


      {mode === "manual" && (

        <section className="panel">

          <h2>MANUAL CONTROL</h2>

          <div className="controls">

            <button
              onClick={() =>
                manualCommand("forward")
              }
            >
              FORWARD
            </button>

            <div className="middle">

              <button
                onClick={() =>
                  manualCommand("left")
                }
              >
                LEFT
              </button>

              <button
                className="stop"
                onClick={() =>
                  manualCommand("stop")
                }
              >
                STOP
              </button>

              <button
                onClick={() =>
                  manualCommand("right")
                }
              >
                RIGHT
              </button>

            </div>

            <button
              onClick={() =>
                manualCommand("backward")
              }
            >
              BACKWARD
            </button>

          </div>

        </section>

      )}


      {mode === "voice" && (

        <section className="panel voice">

          <h2>VOICE CONTROL</h2>

          <button
            className={`mic ${
              listening
                ? "listening"
                : ""
            }`}
            onClick={startVoice}
            disabled={listening}
          >
            {listening
              ? "LISTENING..."
              : "TAP TO SPEAK"}
          </button>

          <div className="voiceInfo">

            <div>
              <small>
                LAST COMMAND
              </small>

              <strong>
                {command}
              </strong>
            </div>

            <div>
              <small>
                STATUS
              </small>

              <strong>
                {status}
              </strong>
            </div>

          </div>

          <p>
            Say: forward, backward, left,
            right or stop
          </p>

        </section>

      )}

    </div>
  );
}

export default App;
```
