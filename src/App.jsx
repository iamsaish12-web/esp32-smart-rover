import { useState } from "react";
import "./App.css";

function App() {
  const [mode, setMode] = useState("manual");
  const [status, setStatus] = useState("READY");
  const [command, setCommand] = useState("STOP");
  const [listening, setListening] = useState(false);

  // Send command to ESP32
  async function sendCommand(cmd) {
    try {
      const response = await fetch(`/api/${cmd}`);

      if (response.ok) {
        setCommand(cmd.toUpperCase());
        setStatus("CONNECTED");
      } else {
        setStatus("ESP32 ERROR");
      }
    } catch (error) {
      setStatus("ESP32 OFFLINE");
    }
  }

  // Manual control
  function manualCommand(cmd) {
    sendCommand(cmd);
  }

  // Voice control
  async function startVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        // Stop microphone
        stream.getTracks().forEach((track) => track.stop());

        setListening(false);
        setStatus("PROCESSING...");

        // Create audio file
        const audioBlob = new Blob(audioChunks, {
          type: "audio/webm",
        });

        const formData = new FormData();

        formData.append(
          "file",
          audioBlob,
          "voice.webm"
        );

        try {
          // Send audio to Whisper server
          const response = await fetch("/voice", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          console.log("Whisper result:", data);

          if (data.command) {
            setCommand(data.command.toUpperCase());
            setStatus("CONNECTED");
          } else {
            setCommand(data.text || "NO SPEECH");
            setStatus("UNKNOWN COMMAND");
          }

        } catch (error) {
          console.error(error);
          setStatus("VOICE SERVER ERROR");
        }
      };

      // Start recording
      recorder.start();

      setListening(true);
      setStatus("LISTENING...");

      // Record for 3 seconds
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

      {/* HEADER */}

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


      {/* MODE */}

      <section className="mode">

        <h2>CONTROL MODE</h2>

        <div className="modeButtons">

          <button
            className={mode === "manual" ? "active" : ""}
            onClick={() => setMode("manual")}
          >
            MANUAL
          </button>

          <button
            className={mode === "voice" ? "active" : ""}
            onClick={() => setMode("voice")}
          >
            VOICE
          </button>

        </div>

      </section>


      {/* MANUAL */}

      {mode === "manual" && (

        <section className="panel">

          <h2>MANUAL CONTROL</h2>

          <div className="controls">

            <button
              onClick={() => manualCommand("forward")}
            >
              FORWARD
            </button>

            <div className="middle">

              <button
                onClick={() => manualCommand("left")}
              >
                LEFT
              </button>

              <button
                className="stop"
                onClick={() => manualCommand("stop")}
              >
                STOP
              </button>

              <button
                onClick={() => manualCommand("right")}
              >
                RIGHT
              </button>

            </div>

            <button
              onClick={() => manualCommand("backward")}
            >
              BACKWARD
            </button>

          </div>

        </section>

      )}


      {/* VOICE */}

      {mode === "voice" && (

        <section className="panel voice">

          <h2>VOICE CONTROL</h2>

          <button
            className={`mic ${
              listening ? "listening" : ""
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
              <small>LAST COMMAND</small>
              <strong>{command}</strong>
            </div>

            <div>
              <small>STATUS</small>
              <strong>{status}</strong>
            </div>

          </div>

          <p>
            Say: forward, backward, left, right or stop
          </p>

        </section>

      )}

    </div>
  );
}

export default App;