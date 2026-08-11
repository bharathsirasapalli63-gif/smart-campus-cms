n=int(input("enter n value"))
for n in range(1,n+1) :
    if n%3==0 and n%5==0 :
        print(f"{n} fizzbuzz")
    elif n%3==0 :
        print(f"{n} fuzz")
    elif  n%5==0 :
        print(f"{n} fizzbuzz")
    else :
        print(n)  



