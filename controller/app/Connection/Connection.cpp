#include "Connection.h"

using namespace arduino;

boolean Connection::connect()
{
  Serial.print("Connecting to WiFi network: ");
  Serial.print(WiFiSSID);
  Serial.println("...");

  if (this->wifiStatus != WL_CONNECTED)
  {
    this->wifiStatus = WiFi.begin(WiFiSSID, WiFiPassword);

    if (this->wifiStatus != WL_CONNECTED)
    {
      Serial.print("Failed to connect. Status code: ");
      Serial.println(WiFi.reasonCode());

      return false;
    }
  }

  return false;
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

bool Connection::sendMessage(Message message)
{
  switch (message.getType())
  {
  case MSG_AUTHORIZATION:
    return false;
  default:
    return false;
  }
}

TriState Connection::isAuthorized()
{
  return TRI_STATE_ERROR;
}
