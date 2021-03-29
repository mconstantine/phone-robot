#include "Config.h"

class State
{
public:
  static const int Error = 0;
  static const int Initial = 1;
  static const int Connected = 2;
  static const int WaitingForAuthorization = 3;
  static const int Authorized = 4;
  static const int Handshaking = 5;
  static const int Ready = 6;

  void setup();
  void setState(int newState);
  int getState();
  String getStateName();

private:
  int currentState;
  void showCurrentState();
};

void State::setup()
{
  this->currentState = Initial;
  this->showCurrentState();
}

void State::setState(int newState)
{
  if (this->currentState == newState)
  {
    return;
  }

  int actualNewState = this->currentState;

  if (newState == Error)
  {
    actualNewState = Error;
  }
  else if (newState == Initial)
  {
    actualNewState = Initial;
  }
  else if (this->currentState == Initial)
  {
    if (newState == Connected)
    {
      actualNewState = Connected;
    }
  }
  else if (this->currentState == Connected)
  {
    if (newState == WaitingForAuthorization)
    {
      actualNewState = WaitingForAuthorization;
    }
  }
  else if (this->currentState == WaitingForAuthorization)
  {
    if (newState == Authorized)
    {
      actualNewState = Authorized;
    }
  }
  else if (this->currentState == Authorized)
  {
    if (newState == Handshaking)
    {
      actualNewState = Handshaking;
    }
  }
  else if (this->currentState == Handshaking)
  {
    if (newState == Authorized)
    {
      actualNewState = Authorized;
    }
    else if (newState == Ready)
    {
      actualNewState = Ready;
    }
  }
  else if (currentState == Ready)
  {
    if (newState == Authorized)
    {
      actualNewState = Authorized;
    }
  }

  if (this->currentState == actualNewState)
  {
    return;
  }

  this->currentState = actualNewState;
  this->showCurrentState();
};

int State::getState()
{
  return this->currentState;
};

String State::getStateName()
{
  if (this->currentState == Initial)
  {
    return "Initial";
  }
  else if (this->currentState == Connected)
  {
    return "Connected";
  }
  else if (this->currentState == WaitingForAuthorization)
  {
    return "WaitingForAuthorization";
  }
  else if (this->currentState == Authorized)
  {
    return "Authorized";
  }
  else if (this->currentState == Handshaking)
  {
    return "Handshaking";
  }
  else if (this->currentState == Ready)
  {
    return "Ready";
  }
}

void State::showCurrentState()
{
  SerialUSB.print("New state: ");
  SerialUSB.print(this->getStateName());
  SerialUSB.println(".");

  const int leds[] = {PIN_LED_1, PIN_LED_2, PIN_LED_3, PIN_LED_4, PIN_LED_5};
  const int totalLedsCount = 5;
  int litLedsCount = 0;

  if (this->currentState == Error)
  {
    litLedsCount = 0;
  }
  else if (this->currentState == Initial)
  {
    litLedsCount = 1;
  }
  else if (this->currentState == Connected)
  {
    litLedsCount = 2;
  }
  else if (this->currentState == WaitingForAuthorization)
  {
    litLedsCount = 2;
  }
  else if (this->currentState == Authorized)
  {
    litLedsCount = 3;
  }
  else if (this->currentState == Handshaking)
  {
    litLedsCount = 4;
  }
  else if (this->currentState == Ready)
  {
    litLedsCount = 5;
  }

  for (int i = 0; i < litLedsCount; i++)
  {
    digitalWrite(leds[i], HIGH);
  }

  for (int i = litLedsCount; i < totalLedsCount; i++)
  {
    digitalWrite(leds[i], LOW);
  }

  if (this->currentState == Error)
  {
    digitalWrite(PIN_LED_ERROR, HIGH);
  }
  else
  {
    digitalWrite(PIN_LED_ERROR, LOW);
  }
}
