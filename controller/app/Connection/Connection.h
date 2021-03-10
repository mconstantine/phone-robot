#ifndef CONNECTION_H
#define CONNECTION_H

#include <SPI.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>
#include "../Config.h"
#include "../Message/Message.h"

class Connection
{
private:
  WiFiClient wifi = WiFiClient();
  WebSocketClient client = WebSocketClient(this->wifi, ServerAddress, ServerPort);
  int wifiStatus;
  boolean serverStatus;

public:
  Connection();
  bool connect();
  void disconnect();
  template <size_t Capacity>
  bool sendMessage(Message<Capacity> message);
};

Connection::Connection()
{
  this->wifiStatus = WL_IDLE_STATUS;
}

#endif
