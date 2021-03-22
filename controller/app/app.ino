#include "Config.h"
#include "State.hpp"

using namespace websockets2_generic;

WebsocketsClient client;
State currentState;
String ackMessage;
long lastMessageSentAt = 0;
long receivedMessagesCount = 0;
long averageRTT = 0;

void setup()
{
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
    currentState.setState(State::Authorized);
  }
  else if (type == "Handshaking")
  {
    const long newReceivedMessagesCount = receivedMessagesCount + 1;
    const long now = millis();

    if (lastMessageSentAt != 0)
    {
      const long rtt = now - lastMessageSentAt;
      averageRTT = ((averageRTT * receivedMessagesCount) + rtt) / newReceivedMessagesCount;

      SerialUSB.print("Received ");
      SerialUSB.print(newReceivedMessagesCount);
      SerialUSB.print(" messages. ");
      SerialUSB.print("Average RTT is ");
      SerialUSB.print(averageRTT);
      SerialUSB.println(".");
    }

    receivedMessagesCount = newReceivedMessagesCount;
    sendAck();
    lastMessageSentAt = now;

    if (receivedMessagesCount == 100)
    {
      currentState.setState(State::Ready);
    }
  }
}

void sendAck()
{
  bool success = client.send(ackMessage);

  if (!success)
  {
    SerialUSB.println("Unable to send acknowledgement. Retrying in 3 seconds.");
    delay(3000);
    sendAck();
  }
}
