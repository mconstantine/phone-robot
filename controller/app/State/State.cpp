#include "State.h"

void State::showState()
{
  int leds[] = {LED_1, LED_2, LED_3, LED_4, LED_5};
  int highLedsCount = 0;

  switch (this->stateType)
  {
  case STATE_INITIAL:
    highLedsCount = 1;
    break;
  case STATE_CONNECTED:
  case STATE_WAITING_FOR_AUTHORIZATION:
    highLedsCount = 2;
    break;
  case STATE_AUTHORIZED:
    highLedsCount = 3;
    break;
  case STATE_READY:
    highLedsCount = 5;
    break;
  }

  for (int i = 0; i < highLedsCount; i++)
  {
    digitalWrite(leds[i], HIGH);
  }

  for (int i = highLedsCount; i < 5; i++)
  {
    digitalWrite(leds[i], LOW);
  }
}

StateType State::update(StateType newStateType)
{
  if (newStateType == this->stateType)
  {
    return newStateType;
  }

  StateType newState = this->stateType;

  switch (this->stateType)
  {
  case STATE_INITIAL:
    switch (newStateType)
    {
    case STATE_CONNECTED:
      newState = STATE_CONNECTED;
      break;
    case STATE_INITIAL:
    case STATE_WAITING_FOR_AUTHORIZATION:
    case STATE_AUTHORIZED:
    case STATE_READY:
      break;
    }
  case STATE_CONNECTED:
    switch (newStateType)
    {
    case STATE_INITIAL:
      newState = STATE_INITIAL;
      break;
    case STATE_WAITING_FOR_AUTHORIZATION:
      newState = STATE_WAITING_FOR_AUTHORIZATION;
      break;
    case STATE_AUTHORIZED:
    case STATE_CONNECTED:
    case STATE_READY:
      break;
    }
  case STATE_WAITING_FOR_AUTHORIZATION:
    switch (newStateType)
    {
    case STATE_INITIAL:
      newState = STATE_INITIAL;
      break;
    case STATE_AUTHORIZED:
      newState = STATE_AUTHORIZED;
      break;
    case STATE_WAITING_FOR_AUTHORIZATION:
    case STATE_CONNECTED:
    case STATE_READY:
      break;
    }
  case STATE_AUTHORIZED:
    switch (newStateType)
    {
    case STATE_INITIAL:
      newState = STATE_INITIAL;
      break;
    case STATE_READY:
      newState = STATE_READY;
      break;
    case STATE_CONNECTED:
    case STATE_WAITING_FOR_AUTHORIZATION:
    case STATE_AUTHORIZED:
      break;
    }
  case STATE_READY:
    switch (newStateType)
    {
    case STATE_INITIAL:
      newState = STATE_INITIAL;
      break;
    case STATE_CONNECTED:
    case STATE_WAITING_FOR_AUTHORIZATION:
    case STATE_AUTHORIZED:
    case STATE_READY:
      break;
    }
  }

  this->previousStateType = this->stateType;
  this->stateType = newState;
  this->showState();

  return newState;
}

boolean State::didChange()
{
  return this->stateType != this->previousStateType;
}
