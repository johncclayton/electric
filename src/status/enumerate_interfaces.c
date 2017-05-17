#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/ioctl.h>
#include <net/if.h>
#include <arpa/inet.h>
#include <netinet/in.h>

/* This is defined on Mac OS X */
#ifndef _SIZEOF_ADDR_IFREQ
#define _SIZEOF_ADDR_IFREQ sizeof
#endif

int main (int argc, const char* argv[])
{
  // File descriptor for socket
  int socketfd;
  struct ifconf conf;
  char data[4096];
  struct ifreq *ifr;
  char addrbuf[1024];
  int i;

  printf("Opening socket...");
  socketfd = socket(AF_INET, SOCK_DGRAM, 0);
  if (socketfd >= 0) {
    printf(" OK\n");
    conf.ifc_len = sizeof(data);
    conf.ifc_buf = (caddr_t) data;
    if (ioctl(socketfd,SIOCGIFCONF,&conf) < 0) {
      perror("ioctl");
    }

    printf("Discovering interfaces...\n");
    i = 0;
    ifr = (struct ifreq*)data;
    while ((char*)ifr < data+conf.ifc_len) {
      switch (ifr->ifr_addr.sa_family) {
        case AF_INET:
            ++i;
            printf("%d. %s : %s\n", i, ifr->ifr_name, inet_ntop(ifr->ifr_addr.sa_family, &((struct sockaddr_in*)&ifr->ifr_addr)->sin_addr, addrbuf, sizeof(addrbuf)));
            break;
#if 0
        case AF_INET6:
            ++i;
            printf("%d. %s : %s\n", i, ifr->ifr_name, inet_ntop(ifr->ifr_addr.sa_family, &((struct sockaddr_in6*)&ifr->ifr_addr)->sin6_addr, addrbuf, sizeof(addrbuf)));
            break;
#endif
      }
      ifr = (struct ifreq*)((char*)ifr +_SIZEOF_ADDR_IFREQ(*ifr));
    }
    close(socketfd);
  }
  else {
    printf(" Failed!\n");
  }
  return 0;
}
