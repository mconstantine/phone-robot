#ifndef STATE_H
#define STATE_H

int LED_1 = 14;
int LED_2 = 15;
int LED_3 = 16;
int LED_4 = 17;
int LED_5 = 18;

enum StateType
{
  STATE_INITIAL,
  STATE_CONNECTED,
  STATE_WAITING_FOR_AUTHORIZATION,
  STATE_AUTHORIZED,
  STATE_READY,
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
  pinMode(LED_5, OUTPUT);

  this->stateType = STATE_INITIAL;
  this->previousStateType = STATE_INITIAL;
  this->showState();
}

StateType State::getCurrent()
{
  return this->stateType;
}

#endif
