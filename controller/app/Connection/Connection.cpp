#include "Connection.h"
#include "../Config.h"

boolean Connection::connect()
{
  Serial.print("Attempting to connect to Wi-Fi network: ");
  Serial.println(WiFiSSID);

  this->wifiStatus = WiFi.begin(WiFiSSID, WiFiPassword);

  if (this->wifiStatus != WL_CONNECTED)
  {
    Serial.print("Failed. Reason code: ");
    Serial.println(WiFi.reasonCode());
    return false;
  }

  Serial.println("Connected to Wi-Fi. Connecting to server...");
  this->client.begin();

  if (!client.connected())
  {
    Serial.println("Unable to connect to server.");
  }

  Serial.println("Connected.");
  return this->client.connected();
}

void Connection::disconnect()
{
  if (this->wifiStatus == WL_CONNECTED)
  {
    Serial.println("Disconnecting from network.");
    WiFi.end();
    this->wifiStatus = WL_IDLE_STATUS;
  }
}
