#include <Arduino.h>
#include <SPI.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>
#include "Config.h"
#include "State/State.h"
#include "State/State.cpp"
#include "WiFiConnection/WiFiConnection.h"
#include "WiFiConnection/WiFiConnection.cpp"

int status = WL_IDLE_STATUS;
int port = 80;

int LED_SWITCH = 8;

WiFiClient wifiClient = WiFiClient();
WiFiConnection wifi = WiFiConnection(wifiClient);
WebSocketClient client = WebSocketClient(wifiClient, ServerAddress);
State state = State();

void setup()
{
  Serial.begin(9600);
  pinMode(LED_SWITCH, INPUT);
}

void loop()
{
  if (!digitalRead(LED_SWITCH))
  {
    state.update(INITIAL);
    wifi.disconnect();
    return;
  }

  switch (state.getCurrent())
  {
  case INITIAL:
    if (wifi.connect())
    {
      state.update(CONNECTED_TO_INTERNET);
    }
    else
    {
      delay(10000);
    }

    break;
  case CONNECTED_TO_INTERNET:
    // TODO: connect to WebSocket
    break;
  case CONNECTED_TO_SOCKET:
    // TODO: wait for application
    break;
  case READY:
    // TODO: listen for commands
    break;
  }
}
