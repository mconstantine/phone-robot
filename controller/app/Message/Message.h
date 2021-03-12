#ifndef MESSAGE_H
#define MESSAGE_H

#include <Arduino_JSON.h>

using namespace websockets2_generic;

enum MsgType
{
  MSG_AUTHORIZATION,
  MSG_RESET,
};

enum ResponseType
{
  RESP_AUTHORIZATION
};

class Message
{
protected:
  MsgType type;
  String message;

public:
  MsgType getType();
  String getMessage();
};

MsgType Message::getType()
{
  return this->type;
};

String Message::getMessage()
{
  return this->message;
};

class AuthorizationMessage : public Message
{
public:
  AuthorizationMessage();
};

class ResetMessage : public Message
{
public:
  ResetMessage();
};

template <typename ResultMessage>
class Response
{
protected:
  ResponseType type;
  ResultMessage decodedMessage;

public:
  ResponseType getType();
  bool isValid(String message);
  ResultMessage getDecodedMessage();
};

template <typename ResultMessage>
ResultMessage Response<ResultMessage>::getDecodedMessage()
{
  return this->decodedMessage;
}

struct AuthorizationResponseStruct
{
  String result;
};

class AuthorizationResponse : public Response<AuthorizationResponseStruct>
{
public:
  const String RESULT_AUTHORIZED = "Authorized";
  const String RESULT_REFUSED = "Refused";

  AuthorizationResponse();
  bool isValid(String message);
};

#endif
