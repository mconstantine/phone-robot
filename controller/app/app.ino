int LED_1 = 14;
int LED_2 = 15;
int LED_3 = 18;
int LED_4 = 20;
int LED_SWITCH = 8;

void setup() {
  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  pinMode(LED_3, OUTPUT);
  pinMode(LED_4, OUTPUT);
  pinMode(LED_SWITCH, INPUT);
}

void loop() {
  int isThingOn = digitalRead(LED_SWITCH);

  digitalWrite(LED_1, isThingOn);
  digitalWrite(LED_2, isThingOn);
  digitalWrite(LED_3, isThingOn);
  digitalWrite(LED_4, isThingOn);
}
