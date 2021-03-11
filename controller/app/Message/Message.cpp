#include "Message.h"

AuthorizationMessage::AuthorizationMessage()
{
  this->type = MSG_AUTHORIZATION;
}

arduino::String AuthorizationMessage::getMessage()
{
  JSONVar document;

  document["type"] = "Authorization";
  document["from"] = "Robot";
  document["accessToken"] = Secret;

  return JSON.stringify(document);
}

AuthorizationResponse::AuthorizationResponse()
{
  this->type = RESP_AUTHORIZATION;
}

bool AuthorizationResponse::isValid(arduino::String message)
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
