import random

secreat=random.randint(1,100)
while True :
    guess=int(input("enter guessing number"))
    if guess>secreat :
        print("the guessing number is too high")
    elif guess<secreat :
        print("the guessing number is too low")
    else :
        print("the gueesing number is equal to secreat number")
        break

