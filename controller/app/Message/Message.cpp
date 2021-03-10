#include "Message.h"

AuthorizationMessage::AuthorizationMessage()
{
  this->type = MSG_AUTHORIZATION;
  this->document["type"] = "Authorization";
  this->document["from"] = "Robot";
  this->document["accessToken"] = Secret;
}
