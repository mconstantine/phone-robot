#ifndef WIFI_CONNECTION_H
#define WIFI_CONNECTION_H

#include <SPI.h>
#include <WiFiNINA.h>

class WiFiConnection
{
private:
  int status;

public:
  WiFiConnection(WiFiClient client);
  int getStatus();
  boolean connect();
  void disconnect();
};

WiFiConnection::WiFiConnection(WiFiClient client)
{
  this->status = WL_IDLE_STATUS;
}

int WiFiConnection::getStatus()
{
  return this->status;
}

#endif
