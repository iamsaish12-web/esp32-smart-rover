#include <WiFi.h>
#include <WebServer.h>

// =========================
// L298N PINS
// =========================

#define ENA 25
#define IN1 26
#define IN2 14

#define IN3 27
#define IN4 12
#define ENB 13


// =========================
// WIFI
// =========================

const char* ssid = "ESP32-Rover";
const char* password = "12345678";

WebServer server(80);


// =========================
// MOTOR SPEED
// =========================

int motorSpeed = 70;

// PWM settings
const int PWM_FREQ = 1000;
const int PWM_RESOLUTION = 8;


// =========================
// STOP
// =========================

void stopMotors() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}


// =========================
// FORWARD
// =========================

void forward() {

  // Left side
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  // Right side
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  int pwmValue = map(
    motorSpeed,
    0,
    100,
    0,
    255
  );

  ledcWrite(ENA, pwmValue);
  ledcWrite(ENB, pwmValue);
}


// =========================
// BACKWARD
// =========================

void backward() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  int pwmValue = map(
    motorSpeed,
    0,
    100,
    0,
    255
  );

  ledcWrite(ENA, pwmValue);
  ledcWrite(ENB, pwmValue);
}


// =========================
// LEFT
// =========================

void left() {

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);

  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  int pwmValue = map(
    motorSpeed,
    0,
    100,
    0,
    255
  );

  ledcWrite(ENA, pwmValue);
  ledcWrite(ENB, pwmValue);
}


// =========================
// RIGHT
// =========================

void right() {

  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);

  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  int pwmValue = map(
    motorSpeed,
    0,
    100,
    0,
    255
  );

  ledcWrite(ENA, pwmValue);
  ledcWrite(ENB, pwmValue);
}


// =========================
// SPEED
// =========================

void setSpeed() {

  if (server.hasArg("value")) {

    motorSpeed = server.arg("value").toInt();

    motorSpeed = constrain(
      motorSpeed,
      0,
      100
    );

    int pwmValue = map(
      motorSpeed,
      0,
      100,
      0,
      255
    );

    ledcWrite(ENA, pwmValue);
    ledcWrite(ENB, pwmValue);

    server.sendHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    server.send(
      200,
      "text/plain",
      "Speed: " + String(motorSpeed)
    );

  } else {

    server.send(
      400,
      "text/plain",
      "Missing speed value"
    );
  }
}


// =========================
// RESPONSE
// =========================

void sendResponse(String message) {

  server.sendHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  server.send(
    200,
    "text/plain",
    message
  );
}


// =========================
// SETUP
// =========================

void setup() {

  Serial.begin(115200);


  // Motor direction pins

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);

  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);


  // PWM setup

  ledcAttach(
    ENA,
    PWM_FREQ,
    PWM_RESOLUTION
  );

  ledcAttach(
    ENB,
    PWM_FREQ,
    PWM_RESOLUTION
  );


  // Start with motors stopped

  ledcWrite(ENA, 0);
  ledcWrite(ENB, 0);

  stopMotors();


  // =========================
  // START WIFI
  // =========================

  WiFi.softAP(
    ssid,
    password
  );

  Serial.println();

  Serial.println("================================");
  Serial.println("       ESP32 ROVER SYSTEM");
  Serial.println("================================");

  Serial.print("WiFi: ");
  Serial.println(ssid);

  Serial.print("IP: ");
  Serial.println(WiFi.softAPIP());


  // =========================
  // ROUTES
  // =========================

  server.on("/", []() {

    sendResponse(
      "ESP32 Rover Online"
    );

  });


  server.on("/forward", []() {

    forward();

    sendResponse("FORWARD");

  });


  server.on("/backward", []() {

    backward();

    sendResponse("BACKWARD");

  });


  server.on("/left", []() {

    left();

    sendResponse("LEFT");

  });


  server.on("/right", []() {

    right();

    sendResponse("RIGHT");

  });


  server.on("/stop", []() {

    stopMotors();

    sendResponse("STOP");

  });


  server.on("/speed", []() {

    setSpeed();

  });


  server.begin();

  Serial.println("Web server started");

}


// =========================
// LOOP
// =========================

void loop() {

  server.handleClient();

}