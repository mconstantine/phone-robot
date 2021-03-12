#include "Connection.h"

boolean Connection::connect()
{
  SerialUSB.print("Connecting to WiFi network: ");
  SerialUSB.print(WiFiSSID);
  SerialUSB.println("...");

  if (WiFi.status() != WL_CONNECTED)
  {
    WiFi.begin(WiFiSSID, WiFiPassword);

    if (WiFi.status() != WL_CONNECTED)
    {
      SerialUSB.print("Failed to connect. Status code: ");
      SerialUSB.println(WiFi.reasonCode());

      return false;
    }
  }

  SerialUSB.println("Connected to WiFi network.");

  this->client.onEvent([&](WebsocketsEvent event, String data) {
    switch (event)
    {
    case WebsocketsEvent::GotPing:
      this->client.pong();
      break;
    default:
      break;
    }
  });

  return true;
}

void Connection::disconnect()
{
  if (this->client.available())
  {
    if (this->sendMessage(ResetMessage()))
    {
      delay(1000);
    }
    else
    {
      SerialUSB.println("Unable to send reset message.");
    }
  }

  if (WiFi.status() == WL_CONNECTED)
  {
    SerialUSB.println("Disconnecting from network.");
    this->client.close();
    WiFi.end();
  }
}

bool Connection::sendMessage(Message message)
{
  SerialUSB.print("Sending message of type ");
  SerialUSB.println(message.getType());

  if (
      !this->client.available() &&
      !this->client.connect(WebSocketServerUrl, ServerPort, WebSocketServerPath))
  {
    SerialUSB.println("Unable to connect to server.");
    return false;
  }

  if (!client.send(message.getMessage()))
  {
    SerialUSB.println("Unable to send message:");
    SerialUSB.println(message.getMessage());

    return false;
  }

  return true;
}

TriState Connection::isAuthorized()
{
  SerialUSB.println("Waiting for authorization...");

  WebsocketsMessage message = this->client.readBlocking();

  if (message.isEmpty())
  {
    return TRI_STATE_RETRY;
  }

  AuthorizationResponse response = AuthorizationResponse();

  if (!response.isValid(message.data()))
  {
    SerialUSB.println("Received invalid message from server.");
    return TRI_STATE_ERROR;
  }

  AuthorizationResponseStruct result = response.getDecodedMessage();

  if (result.result == response.RESULT_AUTHORIZED)
  {
    SerialUSB.println("Authorized.");
    return TRI_STATE_OK;
  }
  else
  {
    SerialUSB.println("Authorization refused by server.");
    return TRI_STATE_ERROR;
  }
}

void Connection::poll()
{
  if (WiFi.status() != WL_CONNECTED || !this->client.available())
  {
    return;
  }

  this->client.poll();
}
