#include <Arduino.h>
#include "State/State.cpp"
#include "Connection/Connection.cpp"
#include "Message/Message.cpp"

int LED_SWITCH = 8;

Connection connection = Connection();
State state = State();
bool isError = false;

void setup()
{
  Serial.begin(9600);
  pinMode(LED_SWITCH, INPUT);
}

void loop()
{
  if (!digitalRead(LED_SWITCH))
  {
    isError = false;
    state.update(STATE_INITIAL);
    connection.disconnect();
    return;
  }

  if (isError)
  {
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
    switch (connection.isAuthorized())
    {
    case TRI_STATE_OK:
      state.update(STATE_AUTHORIZED);
      break;
    case TRI_STATE_ERROR:
      isError = true;
      break;
    case TRI_STATE_RETRY:
      delay(1000);
      break;
    }

    break;
  case STATE_AUTHORIZED:
    // TODO: wait for application
    break;
  case STATE_READY:
    // TODO: listen for commands
    break;
  }
}
