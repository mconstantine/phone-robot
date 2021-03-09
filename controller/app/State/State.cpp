#include "State.h"

void State::showState()
{
  int leds[] = {LED_1, LED_2, LED_3, LED_4};
  int highLedsCount = 0;

  switch (this->stateType)
  {
  case INITIAL:
    highLedsCount = 1;
    break;
  case CONNECTED:
    highLedsCount = 2;
    break;
  case AUTHORIZED:
    highLedsCount = 3;
    break;
  case READY:
    highLedsCount = 4;
    break;
  }

  for (int i = 0; i < highLedsCount; i++)
  {
    digitalWrite(leds[i], HIGH);
  }

  for (int i = highLedsCount; i < 4; i++)
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
  case INITIAL:
    switch (newStateType)
    {
    case INITIAL:
      break;
    case CONNECTED:
      newState = CONNECTED;
      break;
    case AUTHORIZED:
      break;
    case READY:
      break;
    }
  case CONNECTED:
    switch (newStateType)
    {
    case INITIAL:
      newState = INITIAL;
      break;
    case CONNECTED:
      break;
    case AUTHORIZED:
      newState = AUTHORIZED;
      break;
    case READY:
      break;
    }
  case AUTHORIZED:
    switch (newStateType)
    {
    case INITIAL:
      newState = INITIAL;
      break;
    case CONNECTED:
      break;
    case AUTHORIZED:
      break;
    case READY:
      newState = READY;
      break;
    }
  case READY:
    switch (newStateType)
    {
    case INITIAL:
      newState = INITIAL;
      break;
    case CONNECTED:
      break;
    case AUTHORIZED:
      break;
    case READY:
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
  return this->stateType == this->previousStateType;
}
