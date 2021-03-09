#include <Arduino.h>
#include <SPI.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>
#include "Config.h"
#include "State/State.h"
#include "State/State.cpp"
#include "Connection/Connection.h"
#include "Connection/Connection.cpp"

int status = WL_IDLE_STATUS;
int port = 80;

int LED_SWITCH = 8;

Connection connection = Connection();
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
    connection.disconnect();
    return;
  }

  switch (state.getCurrent())
  {
  case INITIAL:
    if (connection.connect())
    {
      state.update(CONNECTED);
    }
    else
    {
      delay(10000);
    }

    break;
  case AUTHORIZED:
    // TODO: wait for application
    break;
  case READY:
    // TODO: listen for commands
    break;
  }
}
