#ifndef MESSAGE_H
#define MESSAGE_H

#include "../Config.h"
#include <ArduinoJson.h>

using namespace arduino;

enum MessageType
{
  MSG_AUTHORIZATION
};

enum ResponseType
{
  RESP_AUTHORIZED,
  RESP_REFUSED
};

template <size_t Capacity>
class Message
{
protected:
  MessageType type;
  StaticJsonDocument<Capacity> document;

public:
  MessageType getType();
  arduino::String getMessage();
};

template <size_t Capacity>
MessageType Message<Capacity>::getType()
{
  return this->type;
};

template <size_t Capacity>
arduino::String Message<Capacity>::getMessage()
{
  String output = "";
  serializeJson(this->document, output);
  return output;
};

class AuthorizationMessage : public Message<JSON_OBJECT_SIZE(3)>
{
public:
  AuthorizationMessage();
};

#endif
