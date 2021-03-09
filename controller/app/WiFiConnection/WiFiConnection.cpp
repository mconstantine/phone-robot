#include "WiFiConnection.h"
#include "../Config.h"

boolean WiFiConnection::connect()
{
  Serial.print("Attempting to connect to Wi-Fi network: ");
  Serial.println(WiFiSSID);

  this->status = WiFi.begin(WiFiSSID, WiFiPassword);

  if (this->status == WL_CONNECTED)
  {
    Serial.println("Connected.");
  }
  else
  {
    Serial.print("Failed. Reason code: ");
    Serial.println(WiFi.reasonCode());
  }

  return this->status == WL_CONNECTED;
}

void WiFiConnection::disconnect()
{
  if (this->status == WL_CONNECTED)
  {
    Serial.println("Disconnecting from network.");
    WiFi.end();
    this->status = WL_IDLE_STATUS;
  }
}
