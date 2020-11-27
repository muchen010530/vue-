class Dep{
    constructor(){
        this.subs = [];
    }
    //收集Watcher观察者
    addSub(watcher){
        this.subs.push(watcher);
    }
    //通知观察者去更新
    notify(){
        this.subs.forEach(w => {
            w.update()
        })
    }
}

class Observer{
    constructor(data){
        this.observer(data);
    }
    observer(data){
        if(data && typeof data === 'object'){
            Object.keys(data).forEach(key => {
                this.defineReactive(data,key,data[key])
            })
        }
    }
    defineReactive(obj,key,value){
        //递归遍历
        this.ovserver(value);
        const dep = new Dep();
        Object.defineProperty(obj,key,{
            enumerable:true,
            configurable:false,
            get(){
                //订阅数据变化时，往Dep中添加观察者，观察我的数据是否发生变化，如果变化就去回调对应的函数去更新视图
                Dep.target && dep.addSub(Dep.target);  //[Observer -> Dep 通知变化]
                return value;
            },
            set:(newValue)=>{//用箭头函数是为了让this指向Observer实例
                this.observer(newValue);
                if(newValue != value){
                    value = newValue;
                }
                //告诉Dep去通知变化
                dep.notify();
            }
        })
    }
}
class Watcher{
    constructor(vm,expr,cb){
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        this.oldVal = this.getOldVal()
    }
    update(){
        let newVal = compileUtil.getVal(this.expr,this.vm);
        if(newVal != this.oldVal){
            this.cb(newVal)
        }
    }
    getOldVal(){
        Dep.target = this;
        let oldVal = compileUtil.getVal(this.expr,this.vm);
        Dep.target = null;
        return oldVal;
    }
}
//外界修改数据时，走到Object.defineProperty的SET方法：拿到新的值，给新的值做个监听，然后更改值为新值，然后Dep通知，拿到对应的观察者，更新对应的函数。