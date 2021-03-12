#include "Message.h"

AuthorizationMessage::AuthorizationMessage()
{
  JSONVar document;

  document["type"] = "Authorization";
  document["from"] = "Robot";
  document["accessToken"] = Secret;

  this->type = MSG_AUTHORIZATION;
  this->message = JSON.stringify(document);
}

ResetMessage::ResetMessage()
{
  JSONVar document;

  document["type"] = "Reset";
  document["from"] = "Robot";

  this->type = MSG_RESET;
  this->message = JSON.stringify(document);
};

AuthorizationResponse::AuthorizationResponse()
{
  this->type = RESP_AUTHORIZATION;
}

bool AuthorizationResponse::isValid(String message)
{
  JSONVar document = JSON.parse(message);

  if (
      JSON.typeof(document) == "undefined" ||
      !document.hasOwnProperty("type"))
  {
    return false;
  }

  AuthorizationResponseStruct response;
  response.result = (const char *)document["type"];
  this->decodedMessage = response;

  return true;
}
