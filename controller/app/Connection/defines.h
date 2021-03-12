#ifndef defines_h
#define defines_h

#if defined(WEBSOCKETS_WIFININA_USE_SAMD)
#undef WEBSOCKETS_WIFININA_USE_SAMD
#endif
#define WEBSOCKETS_USE_WIFININA true
#define WEBSOCKETS_WIFININA_USE_SAMD true
#define BOARD_TYPE "SAMD NANO_33_IOT"

#include <WiFiNINA_Generic.h>

#define DEBUG_WEBSOCKETS_PORT Serial
// Debug Level from 0 to 4
#define _WEBSOCKETS_LOGLEVEL_ 3

#endif
