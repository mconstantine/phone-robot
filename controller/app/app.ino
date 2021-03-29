#include "Config.h"
#include "State.hpp"

using namespace websockets2_generic;
using std::max;
using std::min;

WebsocketsClient client;
State currentState;
String ackMessage;
long lastMessageSentAt = 0;
int receivedHandshakingMessagesCount = 0;
long minRTT = 0;
long maxRTT = 0;
bool isMoving = false;

void setup()
{
  pinMode(PIN_LEFT_SPEED_1, OUTPUT);
  pinMode(PIN_LEFT_SPEED_2, OUTPUT);
  pinMode(PIN_LEFT_SPEED_3, OUTPUT);
  pinMode(PIN_LEFT_SPEED_4, OUTPUT);
  pinMode(PIN_LEFT_SPEED_5, OUTPUT);
  pinMode(PIN_LEFT_PHASE, OUTPUT);

  pinMode(PIN_RIGHT_SPEED_1, OUTPUT);
  pinMode(PIN_RIGHT_SPEED_2, OUTPUT);
  pinMode(PIN_RIGHT_SPEED_3, OUTPUT);
  pinMode(PIN_RIGHT_SPEED_4, OUTPUT);
  pinMode(PIN_RIGHT_SPEED_5, OUTPUT);
  pinMode(PIN_RIGHT_PHASE, OUTPUT);

  pinMode(PIN_SWITCH, INPUT);
  pinMode(PIN_LED_1, OUTPUT);
  pinMode(PIN_LED_2, OUTPUT);
  pinMode(PIN_LED_3, OUTPUT);
  pinMode(PIN_LED_4, OUTPUT);
  pinMode(PIN_LED_5, OUTPUT);
  pinMode(PIN_LED_ERROR, OUTPUT);

  currentState.setup();
  client.onMessage(onWebsocketsMessage);
  client.onEvent(onWebsocketsEvent);

  JSONVar document;

  document["type"] = "Ack";
  document["from"] = "Robot";

  ackMessage = JSON.stringify(document);
}

void loop()
{
  bool isSwitchOn = digitalRead(PIN_SWITCH);

  if (isSwitchOn)
  {
    if (WiFi.status() != WL_CONNECTED)
    {
      SerialUSB.print("Connecting to ");
      SerialUSB.print(WiFiSSID);

      WiFi.begin(WiFiSSID, WiFiPassword);

      for (int i = 0; i < 15 && WiFi.status() != WL_CONNECTED; i++)
      {
        SerialUSB.print(".");
        delay(1000);
      }

      SerialUSB.println("");

      if (WiFi.status() == WL_CONNECTED)
      {
        SerialUSB.println("Connected.");
      }
      else
      {
        SerialUSB.println("Failed. Retrying in 10 seconds.");
        delay(10000);
        return;
      }
    }

    if (!client.available())
    {
      SerialUSB.println("Connecting to server...");
      bool connected = client.connect(WebSocketServerUrl, ServerPort, WebSocketServerPath);

      if (connected)
      {
        SerialUSB.println("Connected.");
      }
      else
      {
        SerialUSB.println("Unable to connect to server. Retrying in 10 seconds.");
        delay(10000);
        return;
      }
    }

    client.poll();

    if (currentState.getState() < State::WaitingForAuthorization)
    {
      SerialUSB.println("Sending authorization request...");

      JSONVar document;

      document["type"] = "Authorization";
      document["from"] = "Robot";
      document["accessToken"] = Secret;

      String message = JSON.stringify(document);
      bool success = client.send(message);

      if (success)
      {
        SerialUSB.println("Sent.");
        currentState.setState(State::WaitingForAuthorization);
      }
      else
      {
        SerialUSB.println("Unable to send the message. Retrying in 3 seconds.");
        delay(3000);
        return;
      }
    }
  }
  else
  {
    if (WiFi.status() == WL_CONNECTED)
    {
      if (client.available() || client.connect(WebSocketServerUrl, ServerPort, WebSocketServerPath))
      {
        SerialUSB.println("Disconnecting from server...");

        JSONVar document;

        document["type"] = "Reset";
        document["from"] = "Robot";

        String message = JSON.stringify(document);

        bool success = client.send(message);

        if (success)
        {
          // If we closed the connection right away, the message would be canceled
          delay(1000);
          client.close();
        }
        else
        {
          SerialUSB.println("Unable to send reset message. Retrying in 3 seconds.");
          delay(3000);
          return;
        }
      }

      SerialUSB.print("Disconnecting from ");
      SerialUSB.print(WiFiSSID);
      SerialUSB.println(".");

      WiFi.end();
    }

    resetNetworkData();
    currentState.setState(State::Initial);
  }
}

void onWebsocketsEvent(WebsocketsEvent event, String data)
{
  if (event == WebsocketsEvent::ConnectionOpened)
  {
    currentState.setState(State::Connected);
  }
  else if (event == WebsocketsEvent::ConnectionClosed)
  {
    resetNetworkData();
    currentState.setState(State::Initial);
  }
  else if (event == WebsocketsEvent::GotPing)
  {
    client.pong();
  }
}

void onWebsocketsMessage(WebsocketsMessage message)
{
  JSONVar document = JSON.parse(message.data());

  if (
      JSON.typeof(document) == "undefined" ||
      !document.hasOwnProperty("type"))
  {
    return;
  }

  const String type = (const char *)document["type"];

  SerialUSB.print("New message of type: ");
  SerialUSB.print(type);
  SerialUSB.println(".");

  if (type == "Authorized")
  {
    currentState.setState(State::Authorized);
  }
  else if (type == "Refused")
  {
    SerialUSB.println("Connection refused by server.");
    currentState.setState(State::Error);
  }
  else if (type == "PeerConnected")
  {
    currentState.setState(State::Handshaking);
  }
  else if (type == "PeerDisconnected")
  {
    resetNetworkData();
    currentState.setState(State::Authorized);
  }
  else if (type == "Handshaking")
  {
    receivedHandshakingMessagesCount++;

    const long now = millis();

    if (lastMessageSentAt != 0)
    {
      const long rtt = now - lastMessageSentAt;

      minRTT = min(minRTT, rtt);
      maxRTT = max(maxRTT, rtt);

      const long averageRTT = (minRTT + maxRTT) / 2.;

      SerialUSB.print("Received ");
      SerialUSB.print(receivedHandshakingMessagesCount);
      SerialUSB.print(" messages. ");
      SerialUSB.print("Average RTT is ");
      SerialUSB.print(averageRTT);
      SerialUSB.println(".");
    }

    sendAck();
    lastMessageSentAt = now;

    if (receivedHandshakingMessagesCount >= 100)
    {
      receivedHandshakingMessagesCount = 0;
      lastMessageSentAt = 0;
      currentState.setState(State::Ready);
    }
  }
  else if (type == "Command")
  {
    if (currentState.getState() != State::Ready)
    {
      return;
    }

    if (
        !document.hasOwnProperty("command") ||
        JSON.typeof_(document["command"]["speed"]) != "number" ||
        JSON.typeof_(document["command"]["angle"]) != "number")
    {
      return;
    }

    double speed = document["command"]["speed"];
    int angle = document["command"]["angle"];

    if (speed < 0 || speed > 1 || angle < 0 || angle > 360)
    {
      return;
    }

    handleCommand(speed, angle);

    const long now = millis();

    if (lastMessageSentAt != 0)
    {
      const long rtt = now - lastMessageSentAt;

      if (rtt > maxRTT + 1000)
      {
        lastMessageSentAt = 0;
      }
      else
      {
        minRTT = min(minRTT, rtt);
        maxRTT = max(maxRTT, rtt);

        const long averageRTT = (minRTT + maxRTT) / 2.;

        SerialUSB.print("Average RTT is ");
        SerialUSB.print(averageRTT);
        SerialUSB.println(".");
      }
    }

    sendAck();
    lastMessageSentAt = now;
  }
}

void sendAck()
{
  bool success = client.send(ackMessage);

  if (success)
  {
    SerialUSB.println("Acknowledged.");
  }
  else
  {
    SerialUSB.println("Unable to send acknowledgement. Retrying in 3 seconds.");
    delay(3000);
    sendAck();
  }
}

void resetNetworkData()
{
  lastMessageSentAt = 0;
  receivedHandshakingMessagesCount = 0;
  minRTT = 0;
  maxRTT = 0;
}

void handleCommand(double speed, int angle)
{
  isMoving = speed > 0;

  double leftTrackSpeed = 0.;
  double rightTrackSpeed = 0.;

  if (angle == 0)
  {
    // Turn right
    leftTrackSpeed = 1.;
    rightTrackSpeed = -1.;
  }
  else if (angle < 90)
  {
    // Go backwards right
    leftTrackSpeed = -1.;
    rightTrackSpeed = -1. + angle / 90.;
  }
  else if (angle == 90)
  {
    // Go backwards
    leftTrackSpeed = -1.;
    rightTrackSpeed = -1.;
  }
  else if (angle < 180)
  {
    // Go backwards left
    rightTrackSpeed = -1.;
    leftTrackSpeed = -1. + (angle - 90) / 90.;
  }
  else if (angle == 180)
  {
    // Turn left
    leftTrackSpeed = -1.;
    rightTrackSpeed = -1.;
  }
  else if (angle < 270)
  {
    // Go forward left
    rightTrackSpeed = 1.;
    leftTrackSpeed = 1. - (angle - 180) / 90.;
  }
  else if (angle == 270)
  {
    // Go forward
    rightTrackSpeed = 1.;
    leftTrackSpeed = 1.;
  }
  else
  {
    // Go forward right
    leftTrackSpeed = 1.;
    rightTrackSpeed = 1. - (angle - 270) / 90.;
  }

  leftTrackSpeed *= speed;
  rightTrackSpeed *= speed;
}
