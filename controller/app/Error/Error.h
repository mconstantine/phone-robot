#ifndef ERROR_H
#define ERROR_H

int LED_ERROR = 19;

class Error
{
private:
  bool _isError;

public:
  Error();
  bool isError();
  void setIsError(bool isError);
};

Error::Error()
{
  pinMode(LED_ERROR, OUTPUT);
};

bool Error::isError()
{
  return this->_isError;
};

void Error::setIsError(bool isError)
{
  this->_isError = isError;
  digitalWrite(LED_ERROR, isError);
};

#endif
