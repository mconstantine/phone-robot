#ifndef CONNECTION_H
#define CONNECTION_H

#include <SPI.h>
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>
#include "../Config.h"

class Connection
{
private:
  WiFiClient wifi = WiFiClient();
  WebSocketClient client = WebSocketClient(this->wifi, ServerAddress, ServerPort);
  int wifiStatus;
  boolean serverStatus;

public:
  Connection();
  boolean connect();
  void disconnect();
};

Connection::Connection()
{
  this->wifiStatus = WL_IDLE_STATUS;
}

#endif
