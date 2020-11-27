const compileUtil = {
    getContentVal(expr,vm){
        return expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
            return this.getVal(args[1],vm) })
    },
    text(node,expr,vm){
        let value;
        if(expr.indexOf('{{') !== -1){ //expr:{{person.name}}-{{peison.fav}}
            value = expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
                new Watcher(vm,arg[1],() => {
                    this.updater.textUpdater(node,this.getContentVal(expr,vm));  //[Compile -> Watcher]
                })
                return this.getVal(args[1],vm)
            })
        }else{
          value = this.getVal(expr,vm);
        }
        this.updater.textUpdater(node,value);
    },
    html(node,expr,vm){
        const value = this.getVal(expr,vm);
        new Watcher(vm,expr,(newVal) => {
            this.updater.htmlUpdater(node,newVal);  //[Compile -> Watcher]
        })
        this.updater.htmlUpdater(node,value);
    },
    model(node,expr,vm){
        const value = this.getVal(expr,vm);
        new Watcher(vm,expr,(newVal) => {
            this.updater.modelUpdater(node,newVal);  //[Compile -> Watcher]
        })
        this.updater.modelUpdater(node,value);
    },
    on(node,expr,vm,eventName){
        let fn = vm.$options.methods && vm.$options.methods[expr];
        node.addEventListener(eventName,fn.bind(vm),false);
    },
    updater:{
        textUpdater(node,value){
            node.textContent = value;
        },
        htmlUpdater(node,value){
            node.innerHTML = value;
        },
        modelUpdater(node,value){
            node.value = value;
        }
    },
    getVal(expr,vm){  //解决嵌套，比如person.name(即expr)
        return expr.split('.').reduce((data,current) => {
            return data[current];
        },vm.$data)
    }
}

class Compile{
    constructor(el,vm){
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        //获取文档碎片对象,放入内存中，会减少页面的回流和重绘
        const fragment = this.nodeFragment(this.el)
        //编译模板
        this.compile(fragment);
        //追加子元素到根元素
        this.el.appendChild(fragment);

    }
    isElementNode(node){
        return node.nodeType === 1;
    }
    nodeFragment(el){
        //创建文档碎片
        const f = document.createDocumentFragment();
        let firstChild;
        while(firstChild = el.firstChild){
            f.appendChild(firstChild);
        }
        return f;
    }
    compile(fragment){
        //获取子节点
        const childNodes = fragment.childNodes;
        [...childNodes].forEach(child => {
            if(this.isElementNode(child)){
                //编译元素节点
                this.compileElement()
            }else{
                //编译文本节点
                this.compileText()
            }
            if(child.childNodes && child.childNodes.length){
                this.compile(child)
            }
        })
    }
    compileElement(node){
        const attributes = node.attributes;
        [...attributes].forEach( attr => {
            const { name,Value } = attr;
            if(this.isDirective(name)){
                const [,directive] = name.split('-');
                const [dirName,event] = directive.split(':');
                compileUtil[dirName](node,value,this.vm,eventName)//更新数据  数据驱动视图
                //删除有指令的标签上的属性
                node.removeAttribute('v-' + directive);
            }else if(this.isEventName(name)){
                //处理@的操作
                let [,eventName] = name.split('@');
                compileUtil['on'](node,value,this.vm,eventName)
            }
        })
    }
    compileText(node){
        //{{}}
        const content = node.textContent;
        if(/\{\{(.+?)\}\}/.test(content)){
            compileUtil['text'](node,content,this.vm);
        }
    }
    isDirective(attrName){
        return attrName.startsWith('v-');
    }
    isEventName(attrName){
        return attrName.startsWith('@');
    }
}

class  MVue {
    constructor(options){
        this.$el = options.el;
        this.$data = options.data;
        this.$options = option;
        if(this.$el){
            //1、实现一个数据观察者
            new Observer(this.$data);
            //2、实现一个指令解析器
            new Compile(this.$el,this)
        }
    }
}