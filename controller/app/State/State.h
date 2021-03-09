#ifndef STATE_H
#define STATE_H

int LED_1 = PIN_A0;
int LED_2 = PIN_A1;
int LED_3 = PIN_A4;
int LED_4 = PIN_A6;

enum StateType
{
  INITIAL,
  CONNECTED_TO_INTERNET,
  CONNECTED_TO_SOCKET,
  READY
};

class State
{
private:
  StateType stateType;
  StateType previousStateType;
  void showState();

public:
  State();
  StateType getCurrent();
  StateType update(StateType newStateType);
  boolean didChange();
};

State::State()
{
  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  pinMode(LED_3, OUTPUT);
  pinMode(LED_4, OUTPUT);

  this->stateType = INITIAL;
  this->previousStateType = INITIAL;
}

StateType State::getCurrent()
{
  return this->stateType;
}

#endif
