#include <Arduino.h>
#include "Config.h"
#include "State/State.cpp"
#include "Connection/Connection.cpp"
#include "Message/Message.cpp"
#include "Error/Error.h"

int LED_SWITCH = 13;

Connection connection;
State state;
Error error;

void setup()
{
  SerialUSB.begin(9600);

  pinMode(LED_SWITCH, INPUT);

  connection.setConnectionCloseCallback([&]() {
    error.setIsError(true);
  });
}

void loop()
{
  if (!digitalRead(LED_SWITCH))
  {
    if (!state.didChange())
    {
      return;
    }

    state.update(STATE_INITIAL);
    error.setIsError(false);
    connection.disconnect();

    return;
  }

  if (error.isError())
  {
    return;
  }

  connection.poll();

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
      error.setIsError(true);
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
