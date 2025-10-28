#define _CRT_SECURE_NO_WARNINGS
#define START "YA바위 게임 시작"
#define term usleep(500000);
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>
#include <unistd.h>


void clearScreen() {
    printf("\033[H\033[J");
}

void start() {
    for (int e = 0; e < 2; e++) {
        printf("\n\n\n\n\t\t" START".\n");
        term
        clearScreen();
        printf("\n\n\n\n\t\t" START"..\n");
        term
        clearScreen();
        printf("\n\n\n\n\t\t" START"...\n");
        term
        clearScreen();
    }
}

void displayCups(int cupWithBall, int userChoice) {
    usleep(500000); 
    
    for (int i = 1; i <= 3; i++) {
        if (i == cupWithBall) {
            if (i == userChoice) {
                usleep(500000);
                printf("\t\t[%d] 공 (맞춤)\n", i);
            } else {
                usleep(500000);
                printf("\t\t[%d] 공\n", i);
            }
        } else {
            if (i == userChoice) {
                usleep(500000);
                printf("\t\t[%d] 빈컵 (틀림)\n", i);
            } else {
                usleep(500000);
                printf("\t\t[%d] 빈컵\n", i);
            }
        }
    }
}


int main() {
    int userChoice, cupWithBall;
    int i;

    

    srand(time(NULL));
    
    clearScreen();
    start();
    
    do {
        
        clearScreen();
        cupWithBall = rand() % 3 + 1;

        
        printf("\n\n\t\t1번\t2번\t3번\n");

        printf("\n\t\t숫자를 선택하세요: ");
        
        if (scanf("%d", &userChoice) != 1 || userChoice < 1 || userChoice > 3) {
            clearScreen();
            printf("\t잘못된 선택입니다.\n");
            continue;
        }

        displayCups(cupWithBall, userChoice);

        if (userChoice == cupWithBall) {
            usleep(500000);
            printf("\n\t정답!\n");
            printf("\t축하합니다! 당신은 이겼습니다!\n");
        } else {
            usleep(500000);
            printf("\n\t틀렸습니다. 공은 %d번 컵에 있었습니다.\n", cupWithBall);
            printf("\t다음 기회에 도전하세요.\n");
        }

        usleep(500000);
        printf("\n\t\t계속하시려면 Enter 를 누르시오");
        while (getchar() != '\n');
        i = getchar();

        
            


    }    while (i == '\n');

    usleep(500000);
    clearScreen();
    printf("\n\n\t\t게임을 종료합니다.\n");
    return 0;
    
}
