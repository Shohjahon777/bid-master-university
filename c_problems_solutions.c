#include <stdio.h>
#include <string.h>

void task1() {
    char sentence[1000];
    char word[100];
    char longest[100] = "";
    int max_len = 0;
    int len, i, j;
    
    printf("Enter a sentence: ");
    fgets(sentence, sizeof(sentence), stdin);
    
    len = strlen(sentence);
    if (len > 0 && sentence[len - 1] == '\n') {
        sentence[len - 1] = '\0';
    }
    
    i = 0;
    while (sentence[i] != '\0') {
        while (sentence[i] == ' ' || sentence[i] == '\t') {
            i++;
        }
        
        if (sentence[i] == '\0') break;
        
        j = 0;
        while (sentence[i] != ' ' && sentence[i] != '\t' && sentence[i] != '\0') {
            word[j++] = sentence[i++];
        }
        word[j] = '\0';
        
        if (j % 2 == 0 && j > max_len) {
            max_len = j;
            strcpy(longest, word);
        }
    }
    
    if (max_len > 0) {
        printf("Longest even-length word: \"%s\"\n", longest);
    } else {
        printf("No even-length word found.\n");
    }
}

void task2() {
    int A[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int B[3][4] = {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}};
    int C[2][4];
    int i, j, k;
    
    for (i = 0; i < 2; i++) {
        for (j = 0; j < 4; j++) {
            C[i][j] = 0;
            for (k = 0; k < 3; k++) {
                C[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    
    printf("Resulting 2x4 matrix:\n");
    for (i = 0; i < 2; i++) {
        for (j = 0; j < 4; j++) {
            printf("%d", C[i][j]);
            if (j < 3) printf(" ");
        }
        if (i < 1) printf(" | ");
    }
    printf("\n");
}

void task3() {
    int num;
    int d[4];
    int i, j;
    
    printf("Enter a 4-digit number: ");
    scanf("%d", &num);
    
    if (num < 1000 || num > 9999) {
        printf("Please enter a valid 4-digit number.\n");
        return;
    }
    
    d[0] = num / 1000;
    d[1] = (num / 100) % 10;
    d[2] = (num / 10) % 10;
    d[3] = num % 10;
    
    for (i = 0; i < 4; i++) {
        for (j = i + 1; j < 4; j++) {
            if (d[i] == d[j]) {
                printf("\"%d\" repeated enter all different\n", d[i]);
                return;
            }
        }
    }
    
    printf("Accepted\n");
}

int main() {
    int choice;
    
    printf("1. Longest Even-Length Word\n");
    printf("2. Matrix Multiplication\n");
    printf("3. Validate Unique Digits\n");
    printf("Enter choice (1-3): ");
    scanf("%d", &choice);
    getchar();
    
    if (choice == 1) task1();
    else if (choice == 2) task2();
    else if (choice == 3) task3();
    else printf("Invalid choice!\n");
    
    return 0;
}
