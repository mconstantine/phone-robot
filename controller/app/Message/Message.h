#ifndef MESSAGE_H
#define MESSAGE_H

#include "../Config.h"
#include <Arduino_JSON.h>

using namespace arduino;

enum MessageType
{
  MSG_AUTHORIZATION
};

enum ResponseType
{
  RESP_AUTHORIZATION
};

class Message
{
protected:
  MessageType type;

public:
  MessageType getType();
  arduino::String getMessage();
};

MessageType Message::getType()
{
  return this->type;
};

class AuthorizationMessage : public Message
{
public:
  AuthorizationMessage();
  arduino::String getMessage();
};

template <typename ResultMessage>
class Response
{
protected:
  ResponseType type;
  ResultMessage decodedMessage;

public:
  ResponseType getType();
  bool isValid(arduino::String message);
  ResultMessage getDecodedMessage();
};

template <typename ResultMessage>
ResultMessage Response<ResultMessage>::getDecodedMessage()
{
  return this->decodedMessage;
}

struct AuthorizationResponseStruct
{
  arduino::String result;
};

class AuthorizationResponse : public Response<AuthorizationResponseStruct>
{
public:
  const arduino::String RESULT_AUTHORIZED = "Authorized";
  const arduino::String RESULT_REFUSED = "Refused";

  AuthorizationResponse();
  bool isValid(arduino::String message);
};

#endif
