#include "Connection.h"

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

  Serial.println("Connected to WiFi network. Connecting to server...");

  this->client.begin();
  bool result = this->client.connected();

  if (result)
  {
    Serial.println("Connected to server.");
  }
  else
  {
    Serial.println("Unable to connect to server.");
  }

  return result;
}

void Connection::disconnect()
{
  if (this->wifiStatus == WL_CONNECTED)
  {
    WiFi.end();
    this->wifiStatus = WL_IDLE_STATUS;
  }
}

template <size_t Capacity>
bool Connection::sendMessage(Message<Capacity> message)
{
  switch (message.getType())
  {
  case MSG_AUTHORIZATION:
    this->client.beginMessage(TYPE_TEXT);
    client.print(message.getMessage());
    return client.endMessage() == 0;
  default:
    return false;
  }
}
