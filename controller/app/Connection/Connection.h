#ifndef CONNECTION_H
#define CONNECTION_H

#include "defines.h"
#include <WebSockets2_Generic.h>
#include "../Config.h"
#include "../Message/Message.h"

using namespace websockets2_generic;

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
  WebsocketsClient client;

public:
  Connection();
  bool connect();
  void disconnect();
  bool sendMessage(Message message);
  TriState isAuthorized();
  void poll();
};

Connection::Connection() {}

#endif
