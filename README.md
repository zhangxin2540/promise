# promise
根据Promises/A+规范实现一个原生Promise
Promise表示一个异步操作的最终结果。与Promise最主要的交互方法是通过将函数传入它的then方法从而获取得Promise最终的值或Promise最终最拒绝（reject）的原因。

Promise解决的问题是以往在js函数中使用回调函数的问题。
没有Promise之前：
```
function personInfo(callback){
    //dosometing
    callback&&callback();
}
```
原生Promise用法
```
let p=new Promise((resolve,reject)=>{
    resolve('123');
});
p.then(data=>{console.log(data)});
```
按照Promise/A+规范来实现一个Promise类。</br>
Promise有三个状态：pending, fulfilled 或 rejected。</br>
初始化状态为pending</br>
成功状态为fulfilled</br>
失败状态rejected</br>
self.value存放的是成功的值</br>
self.reason存放的是失败的值</br>
self.onResolvedCallbacks存的是所有成功回调的值</br>
self.onRejectedCallbacks存的是所有失败回调的值</br>
```
function Promise(executor){
    let self=this;
    self.status='pending';
    self.value=undefined;
    self.reason=undefined;
    self.onResolvedCallbacks=[];
    self.onRejectedCallbacks=[];
    function resolve(value){
        //new Promise(new Promise((resolve,reject)=>resolve()));
        if(value!=null &&value.then&&typeof value.then == 'function'){
            return value.then(resolve,reject);
        }
        setTimeout(function(){
            if(self.status=='pending'){
                self.status='fulfilled';
                self.value=value;
                self.onResolvedCallbacks.forEach(item=>item(self.value));
            }
        });
    }
    function reject(reason){
        setTimeout(function(){
            if(self.status=='pending'){
                self.status='rejected';
                self.reason=reason;
                self.onRejectedCallbacks.forEach(item=>item(self.reason));
            }
        });
    }
    try{
        executor(resolve,reject);
    }catch(e){
        reject(e);
    }
}
```
构造函数原型上的then方法，通过状态获取值。返回一个新的Promise实例。
```
Promise.prototype.then=function(onFulfilled,onRejected){
    onFulfilled=typeof onFulfilled=='function'?onFulfilled:value=>value;
    onRejected=typeof onRejected=='function'?onRejected:reason=>{throw reason};
    let self=this
    let promise2;
    if(self.status=='resolve'){
        return promise2=new Promise((resolve,reject)=>{
            try{
                let x=onFulfilled(self.value);
                resolvePromise(promise2,x,resolve,reject);
            }catch(e){
                reject(e)
            }
        });
    }
    if(self.status=='reject'){
        return promise2=new Promise((resolve,reject)=>{
            try{
                let x = onRejected(self.reason);
                resolvePromise(promise2, x, resolve, reject);
            }catch(e){
                 reject(e)
            }
        });
    }
    if(self.status=='pending'){
        return promise2 = new Promise(function (resolve, reject) {
            self.onResolvedCallbacks.push(()=>{
                try {
                    let x = onFulfilled(self.value);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                 }
            });
            self.onRejectedCallbacks.push(()=>{
                try {
                    let x = onRejected(self.reason);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (e) {
                    reject(e);
                }
            });
        })
    }
}
```
错误捕获,走失败的回调函数
```
Promise.prototype.catch = function(onRejected){
    this.then(null,onRejected);
}
```
Promise.all所有的Promise执行完，再执行下一步。接受的参数是个数组，返回有一个新的Promise实例。数组中的每一项必须为成功态，then得到的值也会依次按顺序排列在数组中
```
Promise.all=function(promises){
    return new Promise((resolve,reject)=>{
        let result=[];
        let count=0;
        let len=promises.length;
        for(let i=0;i<promises.length;i++){
            promises[i].then((data)=>{
                result[i]=data;
                if(++count==len){
                    resolve(result);
                }
            },reject);
        }
    });
}
```
Promise.race一个Promise执行完，就执行下一步。接受的参数是个数组，返回有一个新的Promise实例。
```
Promise.race = function(promises){
    return new Promise(function(resolve,reject){
        for(let i=0;i<promises.length;i++){
            promises[i].then(resolve,reject);
        }
    });
}
```
Promise.resolve返回一个成功态的Promise实例
```
Promise.resolve = function(value){
    return new Promise(function(resolve,reject){
        resolve(value);
    });
}
```
Promise.reject返回一个失败态的Promise实例
```
Promise.reject = function(reason){
    return new Promise(function(reresolve,reject){
        reject(reason);
    });
}
```
