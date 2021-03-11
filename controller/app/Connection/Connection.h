#ifndef CONNECTION_H
#define CONNECTION_H

#include <SPI.h>
#include <WiFiNINA.h>
#include "../Config.h"
#include "../Message/Message.h"

enum TriState
{
  TRI_STATE_OK,
  TRI_STATE_ERROR,
  TRI_STATE_RETRY,
};

class Connection
{
private:
  WiFiClient wifi = WiFiClient();
  int wifiStatus;

public:
  Connection();
  bool connect();
  void disconnect();
  bool sendMessage(Message message);
  TriState isAuthorized();
};

Connection::Connection()
{
  this->wifiStatus = WL_IDLE_STATUS;
}

#endif
