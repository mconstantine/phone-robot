#include <Arduino.h>
#include <SPI.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>
#include "./Config.h"

int status = WL_IDLE_STATUS;
int port = 80;

int LED_1 = 14;
int LED_2 = 15;
int LED_3 = 18;
int LED_4 = 20;
int LED_SWITCH = 8;

WiFiClient wifi;
WebSocketClient client = WebSocketClient(wifi, ServerAddress, port);

void setup()
{
  Serial.begin(9600);

  pinMode(LED_1, OUTPUT);
  pinMode(LED_2, OUTPUT);
  pinMode(LED_3, OUTPUT);
  pinMode(LED_4, OUTPUT);
  pinMode(LED_SWITCH, INPUT);

  connectWiFi();
}

void loop()
{
  int isThingOn = digitalRead(LED_SWITCH);

  digitalWrite(LED_1, isThingOn);
  digitalWrite(LED_2, isThingOn);
  digitalWrite(LED_3, isThingOn);
  digitalWrite(LED_4, isThingOn);
}

void connectWiFi()
{
  while (status != WL_CONNECTED)
  {
    Serial.print("Attempting to connect to Wi-Fi network: ");
    Serial.println(WiFiSSID);

    status = WiFi.begin(WiFiSSID, WiFiPassword);

    if (status != WL_CONNECTED)
    {
      Serial.print("Failed. Reason code: ");
      Serial.println(WiFi.reasonCode());
    }
    else
    {
      Serial.println("Connected.");
    }

    delay(10000);
  }
}
