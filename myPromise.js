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
function resolvePromise(promise2,x,resolve,reject){
    let then;
    //如果x就是promise2
    if(promise2 === x){
        return reject(new TypeError('循环引用'));
    }
    if(x instanceof Promise){
        if(x.status == 'pending'){
            x.then(function(y){
                resolvePromise(promise2,y,resolve,reject);
            },reject);
        }else if(x.status == 'fulfilled'){
            resolve(x.value);
        }else if(x.status == 'rejected'){
            reject(x.reason);
        }
    }else if(x!=null && (typeof x == 'object' || typeof x == 'function')){
        try{
            then = x.then;
            if(typeof then == 'function'){
                then.call(x,function(y){
                    resolvePromise(promise2,y,resolve,reject)
                },reject);
            }
        }catch(e){
            reject(e);
        };
    }else{
        resolve(x);
    }
}
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
Promise.prototype.catch = function(onRejected){
    this.then(null,onRejected);
}
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
Promise.race = function(promises){
    return new Promise(function(resolve,reject){
        for(let i=0;i<promises.length;i++){
            promises[i].then(resolve,reject);
        }
    });
}
Promise.resolve = function(value){
    return new Promise(function(resolve,reject){
        resolve(value);
    });
}
Promise.reject = function(reason){
    return new Promise(function(reresolve,reject){
        reject(reason);
    });
}
let p1=new Promise((resolve,reject)=>{
    resolve(1);
});
let p2=new Promise((resolve,reject)=>{
    resolve(2);
});
Promise.all([p1,p2]).then(data=>{
    console.log(data);
});
Promise.race([p1,p2]).then(data=>{
    console.log(data);
})