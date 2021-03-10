#include <Arduino.h>
#include "State/State.h"
#include "State/State.cpp"
#include "Connection/Connection.h"
#include "Connection/Connection.cpp"
#include "Message/Message.cpp"

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
    state.update(STATE_INITIAL);
    connection.disconnect();
    return;
  }

  switch (state.getCurrent())
  {
  case STATE_INITIAL:
    if (connection.connect())
    {
      state.update(STATE_CONNECTED);
    }
    else
    {
      delay(10000);
    }

    break;
  case STATE_CONNECTED:
    if (connection.sendMessage(AuthorizationMessage()))
    {
      state.update(STATE_WAITING_FOR_AUTHORIZATION);
    }
    else
    {
      delay(3000);
    }
    break;
  case STATE_WAITING_FOR_AUTHORIZATION:
    // TODO: listen for "Authorized" or "Refused" responses
    break;
  case STATE_AUTHORIZED:
    // TODO: wait for application
    break;
  case STATE_READY:
    // TODO: listen for commands
    break;
  }
}
